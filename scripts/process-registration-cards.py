#!/usr/bin/env python3
import json
import re
import shutil
import unicodedata
from datetime import datetime
from pathlib import Path

from pypdf import PdfReader


ROOT_DIR = Path(__file__).resolve().parents[1]
BASE_DIR = ROOT_DIR / "production" / "fichas-funcionais"
INPUT_DIR = BASE_DIR / "entrada"
OUTPUT_DIR = BASE_DIR / "saida"
PROCESSED_DIR = BASE_DIR / "processados"
PENDING_DIR = BASE_DIR / "pendencias"
REGISTRY_PATH = OUTPUT_DIR / "employee-registration-cards.json"
PAYSTUB_MAP_PATH = ROOT_DIR / "production" / "contracheques" / "mapas" / "employee-destinations.csv"


def normalize(value):
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    return re.sub(r"\s+", " ", text.upper()).strip()


def slug(value):
    text = re.sub(r"[^A-Z0-9]+", "-", normalize(value))
    return text.strip("-")[:80] or "SEM-NOME"


def only_digits(value):
    return re.sub(r"\D+", "", str(value or ""))


def valid_cpf(value):
    digits = only_digits(value)
    if len(digits) != 11:
        return ""
    if len(set(digits)) == 1:
        return ""
    return f"{digits[:3]}.{digits[3:6]}.{digits[6:9]}-{digits[9:]}"


def ensure_dirs():
    for folder in [INPUT_DIR, OUTPUT_DIR, PROCESSED_DIR, PENDING_DIR]:
        folder.mkdir(parents=True, exist_ok=True)


def load_paystub_lookup():
    if not PAYSTUB_MAP_PATH.exists():
        return {}

    import csv

    lookup = {}
    with PAYSTUB_MAP_PATH.open("r", encoding="utf-8", newline="") as file:
        for row in csv.DictReader(file):
            cpf = row.get("cpf", "")
            code = row.get("employee_code", "")
            keys = [only_digits(cpf), code]
            for key in keys:
                if key:
                    lookup[key] = {
                        "company_key": row.get("company_name", ""),
                        "department": row.get("department", ""),
                        "employee_code": row.get("employee_code", ""),
                        "full_name": row.get("employee_name", ""),
                    }
    return lookup


def clean_text(value):
    return re.sub(r"\s+", " ", value or "").strip()


def first_match(text, pattern, flags=re.IGNORECASE):
    match = re.search(pattern, text, flags)
    if not match:
        return ""
    return clean_text(match.group(1))


def parse_money(value):
    text = clean_text(value)
    if not text:
        return ""
    return text


def extract_date_after(label, text):
    return first_match(text, rf"{label}\s*:?\s*(\d{{2}}/\d{{2}}/\d{{4}})")


def parse_company(text):
    company = first_match(text, r"EMPRESA:\s*(.+?)\s+(?:Via|Rua|Avenida|Rodovia|CNPJ:|Código:)")
    cnpj = first_match(text, r"CNPJ:\s*CIDADE:.*?(\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2})")
    if not cnpj:
        cnpj = first_match(text, r"(\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2})")

    company_key = slug(company)
    if "COLMOB" in company_key:
        company_key = "COLMOB"
    elif "SERVIMEC" in company_key:
        company_key = "SERVIMEC"
    elif "PRODELAR" in company_key:
        company_key = "PRODELAR"

    return company, company_key, cnpj


def parse_dependents(text):
    section = first_match(text, r"DEPENDENTES\s+(.+?)(?:TRANSFERÊNCIAS|TRANSFERENCIAS|OBSERVAÇÕES|OBSERVACOES|FICHA DE REGISTRO|$)")
    if not section:
        return []

    dependents = []
    pattern = re.compile(
        r"(?:Sim|Não|Nao)\s+(.+?)\s+(\d{2}/\d{2}/\d{4}).+?Tipo Dependente:\s*(.+?)\s+(\d{3}\.\d{3}\.\d{3}-\d{2})",
        re.IGNORECASE,
    )
    for match in pattern.finditer(section):
        dependents.append({
            "name": clean_text(match.group(1)),
            "birth_date": match.group(2),
            "relationship": clean_text(match.group(3)),
            "cpf": match.group(4),
        })
    return dependents


def parse_registration_block(block, source_file, source_pages):
    text = clean_text(block)
    company_name, company_key, company_cnpj = parse_company(text)

    code = first_match(text, r"Código:\s*(\d+)\s+Nome:")
    name = first_match(text, r"Código:\s*\d+\s+Nome:\s*(.+?)\s+Matrícula:")
    registration = first_match(text, r"Matrícula:\s*(\d+)")
    esocial = first_match(text, r"Matrícula eSocial:\s*(\d+)")
    contact = first_match(text, r"([\d() -]{8,})\s*Contato:")
    cpf = first_match(text, r"C\.P\.F\.\s*:\s*(?:Seção\s*:)?\s*(?:Data Pis/Pasep\s*:)?\s*(?:Tipo Habilitação\s*:)?\s*(?:Orgão do Registro\s*:)?\s*(?:\d{2}/\d{2}/\d{4}\s*)?(\d{3}\.\d{3}\.\d{3}-\d{2})")
    if not cpf:
        cpf = first_match(text, r"(\d{3}\.\d{3}\.\d{3}-\d{2})")

    admission_date = first_match(text, r"Data de Admiss[aä]o:\s*Funç[aä]o:\s*Horas Mês\s*:\s*(\d{2}/\d{2}/\d{4})")
    fgts_option_date = first_match(text, r"Data de Opç[aä]o FGTS\s*:\s*Depto:\s*Horas Semana\s*:\s*(\d{2}/\d{2}/\d{4})")
    termination_date = extract_date_after("Data de Demiss[aä]o", text)
    birth_date = first_match(text, r"Data nasc\.:\s*[A-Z]{2}\s*(\d{2}/\d{2}/\d{4})")

    role = first_match(text, r"Data de Admiss[aä]o:\s*Funç[aä]o:\s*Horas Mês\s*:\s*\d{2}/\d{2}/\d{4}\s+(.+?)\s+\d{2,3}:\d{2}")
    department = first_match(text, r"Data de Opç[aä]o FGTS\s*:\s*Depto:\s*Horas Semana\s*:\s*\d{2}/\d{2}/\d{4}\s+(.+?)\s+\d{2,3}:\d{2}")
    payment_type = first_match(text, r"Forma de Pagamento\s*:\s*Salário Atual\s*:\s*(.+?)\s+([\d.]+,\d{2})")
    salary = first_match(text, r"Forma de Pagamento\s*:\s*Salário Atual\s*:\s*.+?\s+([\d.]+,\d{2})")
    cbo = first_match(text, r"CBO:\s*(\d+)")
    mother = first_match(text, r"M[äãa]e\s*:\s*Endereço\s*:\s*Nacionalidade\s*:\s*Grau de Instrução:\s*(.+?)\s+(.+?)\s+Brasileira")
    father = first_match(text, r"Pai\s*:\s*Bairro\s*:.*?Estado Civil:.*?\s+(.+?)\s+Cep:")
    education = first_match(text, r"Brasileira\s+(.+?)\s+Pai\s*:")
    address = first_match(text, r"M[äãa]e\s*:\s*Endereço\s*:\s*Nacionalidade\s*:\s*Grau de Instrução:\s*.+?\s+(.+?)\s+Brasileira")
    neighborhood_city = first_match(text, r"Pai\s*:\s*Bairro\s*:.*?Sexo\s*:\s*(.+?)\s+[MF]\s+UF Naturalidade")
    marital_status = first_match(text, r"Estado Civil:\s*(.+?)\s+[A-Z0-9].*?Cep:")
    pis = first_match(text, r"Pis/Pasep\s*:\s*Cart\. Habilitaç[aä]o\s*:\s*Registro Profiss\.\s*:\s*\d+\s+\d{2}/\d{2}/\d{4}\s+\d+\s+(\d+)")

    output_folder = OUTPUT_DIR / company_key / slug(department) / f"MATR-{registration}-{slug(name)}"

    return {
        "source_file": source_file,
        "source_pages": source_pages,
        "company_name": company_name,
        "company_key": company_key,
        "company_cnpj": company_cnpj,
        "employee_code": f"MATR-{registration}" if registration else code,
        "registration_code": code,
        "registration": registration,
        "esocial_registration": esocial,
        "full_name": name,
        "cpf": cpf,
        "pis_pasep": pis,
        "phone": contact,
        "birth_date": birth_date,
        "mother_name": mother,
        "father_name": father,
        "education": education,
        "marital_status": marital_status,
        "address_raw": clean_text(" ".join([address, neighborhood_city])),
        "admission_date": admission_date,
        "fgts_option_date": fgts_option_date,
        "termination_date": termination_date,
        "department": department,
        "position": role,
        "payment_type": payment_type,
        "base_salary": parse_money(salary),
        "cbo": cbo,
        "dependents": parse_dependents(text),
        "raw_text": text,
        "raw_sections": {
            "documents": first_match(text, r"DOCUMENTOS\s+(.+?)\s+DADOS PESSOAIS"),
            "personal": first_match(text, r"DADOS PESSOAIS\s+(.+?)\s+DADOS EMPREGATÍCIOS"),
            "employment": first_match(text, r"DADOS EMPREGATÍCIOS\s+(.+?)\s+FÉRIAS"),
            "vacations": first_match(text, r"FÉRIAS\s+(.+?)\s+ALTERAÇÃO SALARIAL"),
            "salary_changes": first_match(text, r"ALTERAÇÃO SALARIAL\s+(.+?)(?:CONTRIBUIÇÃO SINDICAL|ALTERAÇÃO DE FUNÇÃO|DEPENDENTES|AFASTAMENTOS|$)"),
            "function_changes": first_match(text, r"ALTERAÇÃO DE FUNÇÃO\s+(.+?)(?:AFASTAMENTOS|DEPENDENTES|TRANSFERÊNCIAS|$)"),
            "leaves": first_match(text, r"AFASTAMENTOS\s+(.+?)(?:QUADRO DE HORÁRIO|DEPENDENTES|TRANSFERÊNCIAS|$)"),
            "work_schedule": first_match(text, r"QUADRO DE HORÁRIO\s+(.+?)(?:DEPENDENTES|TRANSFERÊNCIAS|OBSERVAÇÕES|$)"),
            "transfers": first_match(text, r"TRANSFERÊNCIAS\s+(.+?)(?:OBSERVAÇÕES|FICHA DE REGISTRO|$)"),
        },
        "output_folder": str(output_folder.relative_to(ROOT_DIR)),
    }


def record_key(record):
    cpf = valid_cpf(record.get("cpf"))
    if cpf and record.get("full_name"):
        return only_digits(cpf)
    return ""


def merge_record(base, extra):
    for key, value in extra.items():
        if key == "source_pages":
            base[key] = sorted(set((base.get(key) or []) + (value or [])))
            continue
        if key == "raw_text":
            if value and value not in base.get(key, ""):
                base[key] = clean_text("\n\n".join([base.get(key, ""), value]))
            continue
        if key == "raw_sections":
            current = base.setdefault("raw_sections", {})
            for section_key, section_value in (value or {}).items():
                if section_value and not current.get(section_key):
                    current[section_key] = section_value
            continue
        if key == "dependents":
            current = base.setdefault("dependents", [])
            seen = {item.get("cpf") or normalize(item.get("name")) for item in current}
            for item in value or []:
                item_key = item.get("cpf") or normalize(item.get("name"))
                if item_key and item_key not in seen:
                    current.append(item)
                    seen.add(item_key)
            continue
        if value and not base.get(key):
            base[key] = value
    return base


def merge_records(records):
    merged = {}
    invalid = []
    for record in records:
        key = record_key(record)
        if not key:
            record["import_status"] = "blocked"
            record["import_errors"] = [
                error for error, has_error in [
                    ("missing_name", not record.get("full_name")),
                    ("missing_or_invalid_cpf", not valid_cpf(record.get("cpf"))),
                ] if has_error
            ]
            invalid.append(record)
            continue
        record["cpf"] = valid_cpf(record.get("cpf"))
        record["import_status"] = "imported"
        record["import_errors"] = []
        if key in merged:
            merge_record(merged[key], record)
        else:
            merged[key] = record
    return list(merged.values()), invalid


def enrich_from_paystub_map(record, lookup):
    for key in [only_digits(record.get("cpf")), record.get("employee_code")]:
        if key and key in lookup:
            source = lookup[key]
            if source.get("company_key"):
                record["company_key"] = source["company_key"]
            if source.get("department") and not record.get("department"):
                record["department"] = source["department"]
            if source.get("employee_code") and not record.get("employee_code"):
                record["employee_code"] = source["employee_code"]
            break

    record["output_folder"] = str((OUTPUT_DIR / record.get("company_key", "SEM-EMPRESA") / slug(record.get("department", "")) / f"{record.get('employee_code') or 'SEM-MATRICULA'}-{slug(record.get('full_name'))}").relative_to(ROOT_DIR))
    return record


def split_blocks(pages):
    groups = {}
    pending_continuation = []

    for number, text in pages:
        match = re.search(r"Código:\s*(\d+)\s+Nome:\s*(.+?)\s+Matrícula:\s*(\d+)", text, re.IGNORECASE | re.DOTALL)
        if not match:
            pending_continuation.append((number, text))
            continue

        code = match.group(1)
        name = clean_text(match.group(2))
        registration = match.group(3)
        key = f"{code}|{registration}|{normalize(name)}"
        group = groups.setdefault(key, {"texts": [], "pages": []})

        for pending_number, pending_text in pending_continuation:
            group["texts"].append(f"\n[[PAGE:{pending_number}]]\n{pending_text}")
            group["pages"].append(pending_number)
        pending_continuation = []

        group["texts"].append(f"\n[[PAGE:{number}]]\n{text}")
        group["pages"].append(number)

    blocks = []
    for group in groups.values():
        blocks.append(("\n".join(group["texts"]), sorted(set(group["pages"]))))
    return blocks


def load_existing_registry():
    if not REGISTRY_PATH.exists():
        return []
    return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))


def save_registry(records):
    unique = {}
    for record in records:
        key = record.get("cpf") or "|".join([record.get("company_key", ""), record.get("employee_code", ""), normalize(record.get("full_name", ""))])
        if key:
            unique[key] = record
    sorted_records = sorted(unique.values(), key=lambda item: (item.get("company_key", ""), item.get("department", ""), normalize(item.get("full_name", ""))))
    REGISTRY_PATH.write_text(json.dumps(sorted_records, ensure_ascii=False, indent=2), encoding="utf-8")
    return sorted_records


def process_pdf(pdf_path):
    reader = PdfReader(str(pdf_path))
    pages = []
    for index, page in enumerate(reader.pages, start=1):
        pages.append((index, page.extract_text() or ""))

    parsed_records = []
    for block, page_numbers in split_blocks(pages):
        record = parse_registration_block(block, pdf_path.name, page_numbers)
        if record.get("full_name"):
            parsed_records.append(record)

    paystub_lookup = load_paystub_lookup()
    records, invalid_records = merge_records(parsed_records)
    records = [enrich_from_paystub_map(item, paystub_lookup) for item in records]

    for record in records:
        folder = ROOT_DIR / record["output_folder"]
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "ficha-cadastral-completa.json").write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
        (folder / "ficha-cadastral-completa.txt").write_text(record["raw_text"], encoding="utf-8")

    if invalid_records:
        invalid_path = PENDING_DIR / f"{slug(pdf_path.stem)}-pendencias.json"
        invalid_path.write_text(json.dumps(invalid_records, ensure_ascii=False, indent=2), encoding="utf-8")

    stamp = datetime.now().isoformat(timespec="seconds").replace(":", "-")
    manifest = {
        "sourceFile": pdf_path.name,
        "processedAt": datetime.now().isoformat(timespec="seconds"),
        "totalPages": len(reader.pages),
        "records": len(records),
        "blockedRecords": len(invalid_records),
        "employees": [
            {
                "employeeCode": item.get("employee_code"),
                "fullName": item.get("full_name"),
                "company": item.get("company_key"),
                "department": item.get("department"),
                "cpf": item.get("cpf"),
                "outputFolder": item.get("output_folder"),
            }
            for item in records
        ],
        "blocked": [
            {
                "fullName": item.get("full_name"),
                "cpf": item.get("cpf"),
                "errors": item.get("import_errors", []),
                "sourcePages": item.get("source_pages", []),
            }
            for item in invalid_records
        ],
    }
    manifest_path = PROCESSED_DIR / f"{slug(pdf_path.stem)}-{stamp}.manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    shutil.move(str(pdf_path), str(PROCESSED_DIR / f"{stamp}-{pdf_path.name}"))
    return records, manifest


def main():
    ensure_dirs()
    pdfs = sorted(INPUT_DIR.glob("*.pdf"))
    if not pdfs:
        print(f"Nenhum PDF encontrado em {INPUT_DIR.relative_to(ROOT_DIR)}.")
        return

    existing = load_existing_registry()
    manifests = []
    all_new = []
    for pdf_path in pdfs:
        print(f"Processando {pdf_path.name}...")
        records, manifest = process_pdf(pdf_path)
        manifests.append(manifest)
        all_new.extend(records)

    registry = save_registry(existing + all_new)
    summary = {
        "files": len(manifests),
        "recordsImported": len(all_new),
        "blockedRecords": sum(item.get("blockedRecords", 0) for item in manifests),
        "registryTotal": len(registry),
        "totalPages": sum(item["totalPages"] for item in manifests),
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
