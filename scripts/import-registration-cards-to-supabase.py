#!/usr/bin/env python3
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT_DIR / "production" / "fichas-funcionais" / "saida" / "employee-registration-cards.json"

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "https://vncgdelxlevdndnyjyth.supabase.co").rstrip("/")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_8Cob4xt50ZC_UGD472vkrQ_IL-NUrWB")


def normalize_code(value, limit=32):
    text = str(value or "").encode("ascii", "ignore").decode("ascii").upper()
    text = re.sub(r"[^A-Z0-9]+", "_", text).strip("_")
    return (text or "SEM_CODIGO")[:limit]


def parse_date(value):
    match = re.match(r"^(\d{2})/(\d{2})/(\d{4})$", str(value or ""))
    if not match:
        return None
    return f"{match.group(3)}-{match.group(2)}-{match.group(1)}"


def parse_money(value):
    text = str(value or "").strip()
    if not text:
        return None
    try:
        return float(text.replace(".", "").replace(",", "."))
    except ValueError:
        return None


def request(method, table, query="", body=None, prefer="return=representation", timeout=15):
    url = f"{SUPABASE_URL}/rest/v1/{table}{query}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8")
        raise RuntimeError(f"{method} {table}{query}: {error.code} {detail}") from error


def select_one(table, filters, select="id"):
    query = "?" + urllib.parse.urlencode({"select": select, **filters})
    rows = request("GET", table, query=query, prefer=None)
    return rows[0] if rows else None


def insert_one(table, row, select="id"):
    rows = request("POST", table, body=row, prefer=f"return=representation")
    return rows[0] if rows else None


def update_one(table, record_id, row):
    query = "?" + urllib.parse.urlencode({"id": f"eq.{record_id}"})
    request("PATCH", table, query=query, body=row, prefer="return=minimal")


company_cache = {}
department_cache = {}
position_cache = {}


def get_or_create_company(card):
    code = normalize_code(card.get("company_key") or card.get("company_name"))
    if code in company_cache:
        return company_cache[code]
    existing = select_one("hr_companies", {"code": f"eq.{code}"}, "id,name")
    if existing:
        company_cache[code] = existing
        return existing
    created = insert_one("hr_companies", {
        "code": code,
        "name": card.get("company_key") or card.get("company_name") or "Sem empresa",
        "legal_name": card.get("company_name") or card.get("company_key") or "Sem empresa",
        "document_number": card.get("company_cnpj") or None,
    }, "id,name")
    company_cache[code] = created
    return created


def get_or_create_department(company_id, name):
    department_name = name or "Sem setor"
    key = f"{company_id}|{department_name}"
    if key in department_cache:
        return department_cache[key]
    existing = select_one("hr_departments", {
        "company_id": f"eq.{company_id}",
        "name": f"eq.{department_name}",
    }, "id,name")
    if existing:
        department_cache[key] = existing
        return existing
    created = insert_one("hr_departments", {
        "company_id": company_id,
        "name": department_name,
        "code": normalize_code(department_name, 20),
    }, "id,name")
    department_cache[key] = created
    return created


def get_or_create_position(card):
    name = card.get("position") or "Sem cargo"
    if name in position_cache:
        return position_cache[name]
    existing = select_one("hr_positions", {"name": f"eq.{name}"}, "id,name")
    if existing:
        position_cache[name] = existing
        return existing
    created = insert_one("hr_positions", {
        "name": name,
        "code": normalize_code(name, 24),
        "cbo_code": card.get("cbo") or None,
    }, "id,name")
    position_cache[name] = created
    return created


def find_employee(company_id, card):
    cpf = card.get("cpf")
    if cpf:
        existing = select_one("hr_employees", {"cpf": f"eq.{cpf}"}, "id,employee_code")
        if existing:
            return existing
    code = card.get("employee_code")
    if code:
        return select_one("hr_employees", {
            "company_id": f"eq.{company_id}",
            "employee_code": f"eq.{code}",
        }, "id,employee_code")
    return None


def employee_row(card, company, department, position):
    return {
        "company_id": company["id"],
        "department_id": department["id"],
        "position_id": position["id"],
        "employee_code": card.get("employee_code") or None,
        "esocial_registration": card.get("esocial_registration") or None,
        "full_name": card.get("full_name"),
        "cpf": card.get("cpf"),
        "pis_pasep": card.get("pis_pasep") or None,
        "birth_date": parse_date(card.get("birth_date")),
        "admission_date": parse_date(card.get("admission_date")),
        "termination_date": parse_date(card.get("termination_date")),
        "status": "terminated" if card.get("termination_date") else "active",
        "base_salary": parse_money(card.get("base_salary")),
        "payment_type": card.get("payment_type") or None,
        "work_schedule": (card.get("raw_sections") or {}).get("work_schedule") or None,
        "phone": card.get("phone") or None,
        "address_raw": card.get("address_raw") or None,
        "notes": "Importado da ficha funcional em PDF.",
        "raw_import": {
            "source": "registration_card_pdf",
            "card": card,
        },
    }


def import_card(card):
    company = get_or_create_company(card)
    department = get_or_create_department(company["id"], card.get("department"))
    position = get_or_create_position(card)
    row = employee_row(card, company, department, position)
    existing = find_employee(company["id"], card)
    if existing:
        update_one("hr_employees", existing["id"], row)
        return "updated"
    insert_one("hr_employees", row)
    return "created"


def main():
    cards = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    summary = {"created": 0, "updated": 0, "skipped": 0, "failed": 0}
    failed = []

    for index, card in enumerate(cards, 1):
        if not card.get("full_name") or not card.get("cpf"):
            summary["skipped"] += 1
            continue
        try:
            status = import_card(card)
            summary[status] += 1
            print(f"{index:03d}/{len(cards)} {status}: {card.get('company_key')} - {card.get('full_name')}")
        except Exception as error:
            summary["failed"] += 1
            failed.append({"name": card.get("full_name"), "cpf": card.get("cpf"), "error": str(error)})
            print(f"{index:03d}/{len(cards)} failed: {card.get('full_name')} - {error}")

    print(json.dumps({"total": len(cards), "summary": summary, "failed": failed}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
