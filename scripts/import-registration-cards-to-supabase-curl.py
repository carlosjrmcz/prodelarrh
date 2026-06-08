#!/usr/bin/env python3
import json
import os
import subprocess
import tempfile
import urllib.parse
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT_DIR / "production" / "fichas-funcionais" / "saida" / "employee-registration-cards.json"
SUPABASE_URL = (os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL") or "").rstrip("/")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY") or ""

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY antes de rodar este script.")


def normalize_code(value, limit=32):
    import re
    import unicodedata

    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    text = re.sub(r"[^A-Za-z0-9]+", "_", text).upper().strip("_")
    return (text or "SEM_CODIGO")[:limit]


def parse_date(value):
    import re

    match = re.match(r"^(\d{2})/(\d{2})/(\d{4})$", str(value or ""))
    return f"{match.group(3)}-{match.group(2)}-{match.group(1)}" if match else None


def parse_money(value):
    text = str(value or "").strip()
    if not text:
        return None
    try:
        return float(text.replace(".", "").replace(",", "."))
    except ValueError:
        return None


def curl(method, path, body=None, prefer=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    cmd = [
        "curl",
        "-sS",
        "-L",
        "--fail-with-body",
        "--max-time",
        "60",
        "-X",
        method,
        url,
        "-H",
        f"apikey: {SUPABASE_KEY}",
        "-H",
        f"Authorization: Bearer {SUPABASE_KEY}",
        "-H",
        "Content-Type: application/json",
    ]
    if prefer:
        cmd.extend(["-H", f"Prefer: {prefer}"])
    if body is not None:
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as file:
            json.dump(body, file, ensure_ascii=False)
            temp_path = file.name
        cmd.extend(["--data-binary", f"@{temp_path}"])

    result = subprocess.run(cmd, check=False, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError("\n".join(part for part in [result.stderr, result.stdout] if part))
    if result.stdout.strip():
        return json.loads(result.stdout)
    return None


def query(table, params):
    return curl("GET", f"{table}?{urllib.parse.urlencode(params)}")


def upsert(table, rows, conflict):
    if not rows:
        return []
    path = f"{table}?on_conflict={urllib.parse.quote(conflict, safe=',')}"
    return curl("POST", path, rows, "resolution=merge-duplicates,return=representation")


cards = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))

try:
    curl("DELETE", "hr_employees?employee_code=eq.TESTE-0001", prefer="return=minimal")
except RuntimeError:
    # The test employee may have related demo rows. Keep import running; cleanup can
    # be done with a dedicated SQL script that deletes children first.
    pass

companies = {}
for card in cards:
    code = normalize_code(card.get("company_key") or card.get("company_name"))
    companies[code] = {
        "code": code,
        "name": card.get("company_key") or card.get("company_name") or "Sem empresa",
        "legal_name": card.get("company_name") or card.get("company_key") or "Sem empresa",
        "document_number": card.get("company_cnpj") or None,
    }
upsert("hr_companies", list(companies.values()), "code")
company_rows = query("hr_companies", {"select": "id,code,name"})
company_by_code = {row["code"]: row for row in company_rows}

departments = {}
for card in cards:
    company = company_by_code[normalize_code(card.get("company_key") or card.get("company_name"))]
    name = card.get("department") or "Sem setor"
    departments[f"{company['id']}|{name}"] = {
        "company_id": company["id"],
        "code": normalize_code(name, 20),
        "name": name,
        "is_active": True,
    }
upsert("hr_departments", list(departments.values()), "company_id,name")
department_rows = query("hr_departments", {"select": "id,company_id,name"})
department_by_key = {f"{row['company_id']}|{row['name']}": row for row in department_rows}

positions = {}
for card in cards:
    name = card.get("position") or "Sem cargo"
    positions[name] = {
        "code": normalize_code(name, 24),
        "name": name,
        "cbo_code": card.get("cbo") or None,
        "is_active": True,
    }
upsert("hr_positions", list(positions.values()), "name")
position_rows = query("hr_positions", {"select": "id,name"})
position_by_name = {row["name"]: row for row in position_rows}

employees = []
employee_keys = set()
for card in cards:
    company = company_by_code[normalize_code(card.get("company_key") or card.get("company_name"))]
    department = department_by_key[f"{company['id']}|{card.get('department') or 'Sem setor'}"]
    position = position_by_name[card.get("position") or "Sem cargo"]
    employee_key = f"{company['id']}|{card.get('employee_code')}"
    if employee_key in employee_keys:
        continue
    employee_keys.add(employee_key)
    employees.append({
        "company_id": company["id"],
        "department_id": department["id"],
        "position_id": position["id"],
        "employee_code": card.get("employee_code"),
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
            "source_file": card.get("source_file"),
            "source_pages": card.get("source_pages"),
            "output_folder": card.get("output_folder"),
            "raw_sections": card.get("raw_sections"),
        },
    })

upsert("hr_employees", employees, "company_id,employee_code")
counts = query("hr_employee_directory", {"select": "company_name"})
summary = {}
for row in counts:
    key = row.get("company_name") or "Sem empresa"
    summary[key] = summary.get(key, 0) + 1

print(json.dumps({
    "companies": len(companies),
    "departments": len(departments),
    "positions": len(positions),
    "employees_upserted": len(employees),
    "directory_count_by_company": summary,
}, ensure_ascii=False, indent=2))
