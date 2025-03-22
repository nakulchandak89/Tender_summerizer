import sys
import os
import re
import json
import logging
import argparse
import io
from fuzzywuzzy import fuzz
import pdfplumber
import PyPDF2
import spacy

# Set stdout and stderr encoding to UTF-8 (with replacement for unencodable characters)
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Initialize logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize spaCy model
nlp = spacy.load("en_core_web_sm")

def load_section_keywords(config_file="tender_config.json"):
    try:
        with open(config_file, "r", encoding="utf-8") as file:
            config = json.load(file)
        logging.info("Loaded section keywords successfully.")
        return config.get("section_keywords", {})
    except Exception as e:
        logging.error(f"Failed to load config file: {e}")
        return {}

def clean_sentence(sentence):
    # Remove non-alphanumeric characters and lowercase
    return re.sub(r'[^a-zA-Z0-9\s]', '', sentence).lower()

def classify_sentence(sentence, section_keywords, threshold=80):
    cleaned = clean_sentence(sentence)
    for section, keywords in section_keywords.items():
        for kw in keywords:
            if fuzz.partial_ratio(kw, cleaned) >= threshold:
                return section
    return "Additional Information"

def extract_pdf_text_plumber(file_stream):
    text = ""
    try:
        with pdfplumber.open(file_stream) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        logging.info("Extracted text using pdfplumber.")
        return text
    except Exception as e:
        logging.error(f"pdfplumber failed: {e}")
        return None

def extract_pdf_text_pypdf2(file_stream):
    text = ""
    try:
        reader = PyPDF2.PdfReader(file_stream)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        logging.info("Extracted text using PyPDF2.")
        return text
    except Exception as e:
        logging.error(f"PyPDF2 failed: {e}")
        return None

def extract_pdf_text(file_stream):
    text = extract_pdf_text_plumber(file_stream)
    if text:
        return text
    file_stream.seek(0)
    return extract_pdf_text_pypdf2(file_stream)

def custom_sentence_segmentation(text):
    sentences = []
    lines = text.split('\n')
    for line in lines:
        stripped = line.strip()
        if stripped:
            if not stripped.endswith(('.', ':', ';')):
                stripped += '.'
            sentences.append(stripped)
    logging.info(f"Segmented {len(sentences)} sentences.")
    return sentences

def assemble_document_json(sections):
    structured_data = {
        "Table of Contents": [],
        "Sections": {}
    }
    for section, sentences in sections.items():
        if sentences:
            structured_data["Table of Contents"].append(section)
            structured_data["Sections"][section] = sentences
    return json.dumps(structured_data, indent=4, ensure_ascii=False)

def process_text(text, section_keywords):
    sentences = custom_sentence_segmentation(text)
    sections = {section: [] for section in section_keywords.keys()}
    sections["Additional Information"] = []
    for sentence in sentences:
        section = classify_sentence(sentence, section_keywords)
        sections[section].append(sentence)
    structured_doc_json = assemble_document_json(sections)
    return structured_doc_json

def main():
    parser = argparse.ArgumentParser(description="Tender Document Summarizer")
    parser.add_argument("--file", type=str, help="Path to the input file (PDF or TXT)")
    parser.add_argument("--stdin", action="store_true", help="Read content from stdin")
    parser.add_argument("--ext", type=str, help="File extension: .pdf or .txt", required=True)

    args = parser.parse_args()

    section_keywords = load_section_keywords()

    try:
        if args.stdin:
            logging.info("Reading input from stdin...")
            stdin_input = sys.stdin.buffer.read()
            if args.ext.lower() == ".pdf":
                file_stream = io.BytesIO(stdin_input)
                text = extract_pdf_text(file_stream)
            elif args.ext.lower() == ".txt":
                text = stdin_input.decode('utf-8')
            else:
                raise ValueError("Unsupported file extension from stdin. Use .pdf or .txt")
        elif args.file:
            logging.info(f"Reading file: {args.file}")
            ext = args.ext.lower()
            if ext == ".pdf":
                with open(args.file, 'rb') as f:
                    text = extract_pdf_text(f)
            elif ext == ".txt":
                with open(args.file, 'r', encoding='utf-8') as f:
                    text = f.read()
            else:
                raise ValueError("Unsupported file extension. Use .pdf or .txt")
        else:
            raise ValueError("No input provided. Use --file or --stdin")

        if not text:
            raise ValueError("No text extracted from the document.")

        structured_doc_json = process_text(text, section_keywords)
        print(structured_doc_json)
    except Exception as e:
        logging.error(f"Error in processing: {e}")
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
