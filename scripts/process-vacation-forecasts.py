#!/usr/bin/env python3
import csv
import json
import re
import shutil
import unicodedata
from datetime import datetime
from pathlib import Path

from pypdf import PdfReader


ROOT_DIR = Path(__file__).resolve().parents[1]
BASE_DIR = ROOT_DIR / "production" / "ferias"
INPUT_DIR = BASE_DIR / "entrada"
OUTPUT_DIR = BASE_DIR / "saida"
PROCESSED_DIR = BASE_DIR / "processados"
PENDING_DIR = BASE_DIR / "pendencias"
REGISTRY_PATH = ROOT_DIR / "production" / "fichas-funcionais" / "saida" / "employee-registration-cards.json"
CURRENT_JSON = OUTPUT_DIR / "vacation-forecast-current.json"
HISTORY_JSON = OUTPUT_DIR / "vacation-forecast-history.json"
CURRENT_CSV = OUTPUT_DIR / "vacation-forecast-current.csv"


MONTHS = {
    "JANEIRO": 1,
    "FEVEREIRO": 2,
    "MARCO": 3,
    "MARÇO": 3,
    "ABRIL": 4,
    "MAIO": 5,
    "JUNHO": 6,
    "JULHO": 7,
    "AGOSTO": 8,
    "SETEMBRO": 9,
    "OUTUBRO": 10,
    "NOVEMBRO": 11,
    "DEZEMBRO": 12,
}


def normalize(value):
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    return re.sub(r"\s+", " ", text.upper()).strip()


def slug(value):
    text = re.sub(r"[^A-Z0-9]+", "-", normalize(value))
    return text.strip("-")[:90] or "SEM-NOME"


def ensure_dirs():
    for folder in [INPUT_DIR, OUTPUT_DIR, PROCESSED_DIR, PENDING_DIR]:
        folder.mkdir(parents=True, exist_ok=True)


def iso_date(value):
    if not value or "_" in value:
        return ""
    match = re.match(r"(\d{2})/(\d{2})/(\d{4})", value.strip())
    if not match:
        return ""
    return f"{match.group(3)}-{match.group(2)}-{match.group(1)}"


def parse_decimal(value):
    if value is None:
        return ""
    text = str(value).replace(".", "").replace(",", ".")
    try:
        number = float(text)
    except ValueError:
        return ""
    return int(number) if number.is_integer() else number


def load_registry():
    if not REGISTRY_PATH.exists():
        return {}
    records = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    by_company_code = {}
    by_code = {}
    by_name = {}
    for record in records:
        company = normalize(record.get("company_key") or record.get("company_name"))
        code_digits = re.sub(r"\D+", "", record.get("registration") or record.get("employee_code") or "")
        code_digits = code_digits[-6:].zfill(6) if code_digits else ""
        item = {
            "employee_code": record.get("employee_code") or (f"MATR-{code_digits}" if code_digits else ""),
            "registration": record.get("registration") or code_digits,
            "employee_name": record.get("full_name") or "",
            "company_key": record.get("company_key") or "",
            "department": record.get("department") or "",
            "position": record.get("position") or "",
            "cpf": record.get("cpf") or "",
        }
        if company and code_digits:
            by_company_code[(company, code_digits)] = item
        if code_digits:
            by_code[code_digits] = item
        if item["employee_name"]:
            by_name[normalize(item["employee_name"])] = item
    return {"by_company_code": by_company_code, "by_code": by_code, "by_name": by_name}


def company_from_text(text):
    normalized = normalize(text)
    if "COLMOB" in normalized:
        return "COLMOB"
    if "SERVIMEC" in normalized:
        return "SERVIMEC"
    if "PRODELAR" in normalized:
        return "PRODELAR"
    return "SEM-EMPRESA"


def competence_from_text(text):
    normalized = normalize(text)
    match = re.search(r"PREVISAO DE FERIAS\s*-\s*([A-ZÇ]+)\s*/\s*(\d{4})", normalized)
    if not match:
        return ""
    month = MONTHS.get(match.group(1), "")
    return f"{match.group(2)}-{month:02d}-01" if month else ""


def resolve_employee(registry, company, code, name_fragment):
    company_key = normalize(company)
    item = registry["by_company_code"].get((company_key, code))
    if item:
        return item

    fragment = normalize(name_fragment)
    for full_name, candidate in registry["by_name"].items():
        if fragment and (fragment in full_name or full_name in fragment):
            return candidate

    return {
        "employee_code": f"MATR-{code}" if code else "",
        "registration": code,
        "employee_name": re.sub(r"\s+", " ", name_fragment or "").strip(),
        "company_key": company,
        "department": "",
        "position": "",
        "cpf": "",
    }


def parse_pdf(path, registry):
    reader = PdfReader(str(path))
    pages = []
    for page in reader.pages:
        pages.append(page.extract_text() or "")
    text = "\n".join(pages)
    company = company_from_text(text)
    competence_month = competence_from_text(text)
    records = []
    current_employee = None

    row_pattern = re.compile(
        r"^(\d{2}/\d{2}/\d{4})\s+a\s+(\d{2}/\d{2}/\d{4})\s+"
        r"(\d{2}/\d{2}/\d{4})\s+"
        r"((?:__/\__/____|\d{2}/\d{2}/\d{4})\s+a\s+(?:__/\__/____|\d{2}/\d{2}/\d{4}))"
        r"(.*?)(\d+(?:,\d+)?)$"
    )

    for line in text.splitlines():
        clean = re.sub(r"\s+", " ", line).strip()
        match = row_pattern.match(clean)
        if not match:
            continue

        acquisition_start, acquisition_end, legal_limit, planned_range, middle, balance = match.groups()
        code_match = re.search(r"(\d{6})", middle)
        if code_match:
            code = code_match.group(1)
            name_fragment = middle[code_match.end():].strip()
            current_employee = resolve_employee(registry, company, code, name_fragment)
        if not current_employee:
            continue

        planned_parts = planned_range.split(" a ")
        records.append({
            "source_file": path.name,
            "source_company": company,
            "source_competence_month": competence_month,
            "employee_code": current_employee.get("employee_code") or "",
            "registration": current_employee.get("registration") or "",
            "employee_name": current_employee.get("employee_name") or "",
            "cpf": current_employee.get("cpf") or "",
            "company_key": current_employee.get("company_key") or company,
            "department": current_employee.get("department") or "",
            "position": current_employee.get("position") or "",
            "acquisition_start": iso_date(acquisition_start),
            "acquisition_end": iso_date(acquisition_end),
            "legal_limit_date": iso_date(legal_limit),
            "planned_start": iso_date(planned_parts[0] if planned_parts else ""),
            "planned_end": iso_date(planned_parts[1] if len(planned_parts) > 1 else ""),
            "balance_days": parse_decimal(balance),
            "status": "forecast",
            "can_edit_until": iso_date(legal_limit),
            "submitted_for_review": False,
        })

    return records


def record_key(record):
    return "|".join([
        normalize(record.get("company_key")),
        record.get("employee_code") or normalize(record.get("employee_name")),
        record.get("acquisition_start") or "",
        record.get("acquisition_end") or "",
    ])


def write_outputs(current_records, processed_files):
    previous_history = []
    if HISTORY_JSON.exists():
        previous_history = json.loads(HISTORY_JSON.read_text(encoding="utf-8"))

    history = {record_key(record): record for record in previous_history if record_key(record)}
    for record in current_records:
        key = record_key(record)
        if not key:
            continue
        historical = history.get(key, {})
        history[key] = {
            **historical,
            **record,
            "last_seen_at": datetime.now().isoformat(timespec="seconds"),
        }

    payload = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "processed_files": processed_files,
        "records": current_records,
    }
    CURRENT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    HISTORY_JSON.write_text(json.dumps(list(history.values()), ensure_ascii=False, indent=2), encoding="utf-8")

    fields = [
        "source_company",
        "source_competence_month",
        "employee_code",
        "employee_name",
        "company_key",
        "department",
        "position",
        "acquisition_start",
        "acquisition_end",
        "legal_limit_date",
        "planned_start",
        "planned_end",
        "balance_days",
        "status",
    ]
    with CURRENT_CSV.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        for record in current_records:
            writer.writerow({field: record.get(field, "") for field in fields})


def main():
    ensure_dirs()
    pdfs = sorted(INPUT_DIR.glob("*.pdf"))
    if not pdfs:
        print(json.dumps({
            "ok": False,
            "message": f"Nenhum PDF encontrado em {INPUT_DIR}",
            "input_dir": str(INPUT_DIR),
        }, ensure_ascii=False, indent=2))
        return

    registry = load_registry()
    current_records = []
    processed_files = []
    timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")

    for pdf in pdfs:
        try:
            records = parse_pdf(pdf, registry)
            if not records:
                shutil.move(str(pdf), PENDING_DIR / pdf.name)
                continue
            current_records.extend(records)
            processed_files.append({"file": pdf.name, "records": len(records)})
            shutil.move(str(pdf), PROCESSED_DIR / f"{timestamp}-{pdf.name}")
        except Exception as error:
            error_path = PENDING_DIR / f"{timestamp}-{pdf.stem}.error.txt"
            error_path.write_text(str(error), encoding="utf-8")
            shutil.move(str(pdf), PENDING_DIR / pdf.name)

    write_outputs(current_records, processed_files)
    by_company = {}
    for record in current_records:
        by_company[record.get("source_company") or "SEM-EMPRESA"] = by_company.get(record.get("source_company") or "SEM-EMPRESA", 0) + 1

    print(json.dumps({
        "ok": True,
        "records": len(current_records),
        "by_company": by_company,
        "current_json": str(CURRENT_JSON.relative_to(ROOT_DIR)),
        "history_json": str(HISTORY_JSON.relative_to(ROOT_DIR)),
        "current_csv": str(CURRENT_CSV.relative_to(ROOT_DIR)),
        "processed_files": processed_files,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
