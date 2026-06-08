#!/usr/bin/env python3
import csv
import json
import re
import shutil
import unicodedata
from datetime import datetime
from pathlib import Path

from pypdf import PdfReader, PdfWriter


ROOT_DIR = Path(__file__).resolve().parents[1]
BASE_DIR = ROOT_DIR / "production" / "contracheques"
INPUT_DIR = BASE_DIR / "entrada"
OUTPUT_DIR = BASE_DIR / "saida"
PROCESSED_DIR = BASE_DIR / "processados"
PENDING_DIR = BASE_DIR / "pendencias"
MAP_PATH = BASE_DIR / "mapas" / "employee-destinations.csv"


def normalize(value):
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    return re.sub(r"\s+", " ", text.upper()).strip()


def only_digits(value):
    return re.sub(r"\D+", "", str(value or ""))


def valid_cpf_digits(value):
    digits = only_digits(value)
    if len(digits) != 11:
        return ""
    if len(set(digits)) == 1:
        return ""
    return digits


def slug(value):
    text = re.sub(r"[^A-Z0-9]+", "-", normalize(value))
    return text.strip("-")[:80] or "SEM-NOME"


def ensure_dirs():
    for folder in [INPUT_DIR, OUTPUT_DIR, PROCESSED_DIR, PENDING_DIR, MAP_PATH.parent]:
        folder.mkdir(parents=True, exist_ok=True)


def load_employee_map():
    if not MAP_PATH.exists():
        MAP_PATH.write_text("company_name,department,employee_code,cpf,employee_name,destination_folder\n", encoding="utf-8")

    with MAP_PATH.open("r", encoding="utf-8", newline="") as file:
        rows = list(csv.DictReader(file))

    employees = []
    for row in rows:
        employees.append({
            "company_name": row.get("company_name", "").strip(),
            "department": row.get("department", "").strip(),
            "employee_code": row.get("employee_code", "").strip(),
            "cpf": row.get("cpf", "").strip(),
            "cpf_digits": valid_cpf_digits(row.get("cpf", "")),
            "employee_name": row.get("employee_name", "").strip(),
            "normalized_name": normalize(row.get("employee_name", "")),
            "destination_folder": row.get("destination_folder", "").strip(),
        })
    return employees


def save_employee_map(employees):
    unique = {}
    for employee in employees:
        key = valid_cpf_digits(employee.get("cpf")) or "|".join([
            normalize(employee.get("company_name")),
            employee.get("employee_code") or normalize(employee.get("employee_name")),
        ])
        if key:
            unique[key] = employee

    with MAP_PATH.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=[
            "company_name",
            "department",
            "employee_code",
            "cpf",
            "employee_name",
            "destination_folder",
        ])
        writer.writeheader()
        for employee in sorted(unique.values(), key=lambda item: (normalize(item.get("company_name")), normalize(item.get("department")), normalize(item.get("employee_name")))):
            writer.writerow({
                "company_name": employee.get("company_name", ""),
                "department": employee.get("department", ""),
                "employee_code": employee.get("employee_code", ""),
                "cpf": employee.get("cpf", ""),
                "employee_name": employee.get("employee_name", ""),
                "destination_folder": employee.get("destination_folder", ""),
            })


def identify_employee(text, employees):
    normalized_text = normalize(text)
    digits_text = only_digits(text)

    for employee in employees:
        cpf = employee.get("cpf_digits")
        if cpf and cpf in digits_text:
            return employee, "cpf", "high"

    for employee in employees:
        code = employee.get("employee_code")
        company = employee.get("company_name")
        company_matches = not company or normalize(company) in normalized_text
        if code and company_matches and normalize(code) in normalized_text:
            return employee, "company_employee_code", "high"

    for employee in employees:
        name = employee.get("normalized_name")
        if name and name in normalized_text:
            return employee, "employee_name", "medium"

    return None, "unmatched", "none"


def parse_company_name(text):
    clean = re.sub(r"\s+", " ", text or " ").strip()
    company_match = re.search(r"^(.+?)\s+\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}", clean)
    company_legal = re.sub(r"\s+", " ", company_match.group(1)).strip() if company_match else ""
    normalized_company = normalize(company_legal)

    if "SERVIMEC" in normalized_company:
        return "SERVIMEC", company_legal
    if "COLMOB" in normalized_company:
        return "COLMOB", company_legal
    if "PRODELAR" in normalized_company:
        return "PRODELAR", company_legal
    return slug(company_legal) if company_legal else "SEM-EMPRESA", company_legal


def parse_employee_from_paystub(text):
    clean = re.sub(r"\s+", " ", text or " ").strip()
    normalized = normalize(clean)

    header = re.search(
        r"Depto\.?:\s*(\d{6})\s*-\s*(.+?)\s+(\d{3}\.\d{3}\.\d{3}-\d{2})\s*(\d{6})\s*-\s*([A-ZÀ-ÚÇ0-9 /.-]+?)\s+Func\.:",
        clean,
        re.IGNORECASE,
    )
    if not header:
        return None

    company_name, company_legal_name = parse_company_name(clean)
    name = re.sub(r"\s+", " ", header.group(2)).strip()
    cpf = header.group(3).strip()
    department = re.sub(r"\s+", " ", header.group(5)).strip()

    registration = ""
    position = ""
    role_match = re.search(r"Matrícula:\s*CTPS:\s*\d+\s*-\s*(.+?)\s+(\d{6,12})\s+", clean, re.IGNORECASE)
    if role_match:
        position = re.sub(r"\s+", " ", role_match.group(1)).strip()
        registration = role_match.group(2).strip()

    if not registration:
        compact = only_digits(normalized)
        registration = compact[:10] if compact else slug(name)

    competence_match = re.search(r"Cargo:\s*(\d{2}/\d{4})", clean, re.IGNORECASE)
    admission_match = re.search(r"Admissão:\s*(\d{2}/\d{2}/\d{4})", clean, re.IGNORECASE)

    employee_code = f"MATR-{registration}"
    return {
        "company_name": company_name,
        "company_legal_name": company_legal_name,
        "employee_code": employee_code,
        "cpf": cpf,
        "employee_name": name,
        "normalized_name": normalize(name),
        "cpf_digits": valid_cpf_digits(cpf),
        "destination_folder": f"production/contracheques/saida/{slug(company_name)}/{slug(department)}/{employee_code}-{slug(name)}",
        "department": department,
        "position": position,
        "competence": competence_match.group(1) if competence_match else "",
        "admission_date": admission_match.group(1) if admission_match else "",
    }


def enrich_employee_from_parsed(employee, parsed):
    if not parsed:
        return employee

    for key in ["company_name", "company_legal_name", "department", "position", "competence", "admission_date"]:
        if parsed.get(key) and not employee.get(key):
            employee[key] = parsed[key]

    if parsed.get("company_name") and not employee.get("company_name"):
        employee["company_name"] = parsed["company_name"]

    if parsed.get("department") and not employee.get("department"):
        employee["department"] = parsed["department"]

    current_folder = employee.get("destination_folder", "")
    parsed_folder = parsed.get("destination_folder", "")
    company_slug = slug(parsed.get("company_name", ""))
    if parsed_folder and (not current_folder or f"/saida/{company_slug}/" not in current_folder):
        employee["destination_folder"] = parsed_folder

    if not employee.get("employee_code") and parsed.get("employee_code"):
        employee["employee_code"] = parsed["employee_code"]
    if not employee.get("cpf") and parsed.get("cpf"):
        employee["cpf"] = parsed["cpf"]
        employee["cpf_digits"] = valid_cpf_digits(parsed["cpf"])
    if not employee.get("employee_name") and parsed.get("employee_name"):
        employee["employee_name"] = parsed["employee_name"]
        employee["normalized_name"] = normalize(parsed["employee_name"])

    return employee


def save_page(reader, page_index, target_path):
    writer = PdfWriter()
    writer.add_page(reader.pages[page_index])
    target_path.parent.mkdir(parents=True, exist_ok=True)
    with target_path.open("wb") as file:
        writer.write(file)


def process_pdf(pdf_path, employees):
    reader = PdfReader(str(pdf_path))
    batch_stamp = datetime.now().isoformat(timespec="seconds").replace(":", "-")
    manifest = {
        "sourceFile": pdf_path.name,
        "processedAt": datetime.now().isoformat(timespec="seconds"),
        "totalPages": len(reader.pages),
        "matchedPages": 0,
        "autoRegisteredEmployees": 0,
        "unmatchedPages": 0,
        "pages": [],
    }

    for index, page in enumerate(reader.pages):
        page_number = index + 1
        text = page.extract_text() or ""
        parsed = parse_employee_from_paystub(text)
        employee, method, confidence = identify_employee(text, employees)
        auto_registered = False

        if employee and parsed:
            employee = enrich_employee_from_parsed(employee, parsed)

        if employee is None and parsed:
            employee = parsed
            employees.append(parsed)
            auto_registered = True
            method = "auto_registered_from_paystub"
            confidence = "medium"
            manifest["autoRegisteredEmployees"] += 1

        if employee:
            folder = ROOT_DIR / employee.get("destination_folder", str(OUTPUT_DIR))
            file_base = f"{employee.get('employee_code') or slug(employee.get('employee_name'))}-{slug(employee.get('employee_name'))}-{batch_stamp}-p{page_number}.pdf"
            target_path = folder / file_base
            save_page(reader, index, target_path)
            manifest["matchedPages"] += 1
            manifest["pages"].append({
                "pageNumber": page_number,
                "status": "matched",
                "autoRegistered": auto_registered,
                "employeeCode": employee.get("employee_code"),
                "employeeName": employee.get("employee_name"),
                "companyName": employee.get("company_name", ""),
                "cpf": employee.get("cpf"),
                "department": employee.get("department", ""),
                "position": employee.get("position", ""),
                "competence": employee.get("competence", ""),
                "admissionDate": employee.get("admission_date", ""),
                "method": method,
                "confidence": confidence,
                "outputPath": str(target_path.relative_to(ROOT_DIR)),
                "textSample": text[:300],
            })
            continue

        pending_path = PENDING_DIR / f"PENDENTE-{slug(pdf_path.stem)}-{batch_stamp}-p{page_number}.pdf"
        save_page(reader, index, pending_path)
        manifest["unmatchedPages"] += 1
        manifest["pages"].append({
            "pageNumber": page_number,
            "status": "unmatched",
            "outputPath": str(pending_path.relative_to(ROOT_DIR)),
            "textSample": text[:300],
        })

    manifest_path = PROCESSED_DIR / f"{slug(pdf_path.stem)}-{batch_stamp}.manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    shutil.move(str(pdf_path), str(PROCESSED_DIR / f"{batch_stamp}-{pdf_path.name}"))
    return manifest


def main():
    ensure_dirs()
    employees = load_employee_map()
    pdfs = sorted(INPUT_DIR.glob("*.pdf"))
    if not pdfs:
        print(f"Nenhum PDF encontrado em {INPUT_DIR.relative_to(ROOT_DIR)}.")
        return

    results = []
    for pdf_path in pdfs:
        print(f"Processando {pdf_path.name}...")
        results.append(process_pdf(pdf_path, employees))

    save_employee_map(employees)
    summary = {
        "files": len(results),
        "totalPages": sum(item["totalPages"] for item in results),
        "matchedPages": sum(item["matchedPages"] for item in results),
        "autoRegisteredEmployees": sum(item["autoRegisteredEmployees"] for item in results),
        "unmatchedPages": sum(item["unmatchedPages"] for item in results),
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
