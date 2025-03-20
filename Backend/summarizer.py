import os
import re
import json
import nltk
import spacy
import sys
from PyPDF2 import PdfReader
from io import BytesIO
import codecs  # Import codecs for encoding fixes

# Set UTF-8 encoding for standard output and error
sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())

# # Download required NLTK resources if needed.
# nltk.download("punkt")
# nltk.download("stopwords")
# nltk.download("wordnet")

# Load spaCy English model for robust sentence segmentation.
nlp = spacy.load("en_core_web_sm")

# -------------------------------
# Helper: Guess file extension if missing
# -------------------------------
def guess_file_extension(file_path):
    """Read first few bytes and guess if PDF or TXT."""
    with open(file_path, "rb") as f:
        header = f.read(5)
    if header.startswith(b"%PDF"):
        return ".pdf"
    else:
        return ".txt"

# -------------------------------
# 1. Text Extraction
# -------------------------------
def extract_text(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    if not ext:
        ext = guess_file_extension(file_path)
        print(f"Guessed file extension: {ext}", file=sys.stderr)
    if ext == ".pdf":
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + " "
        return text
    elif ext in [".txt", ".text"]:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    else:
        raise ValueError(f"Unsupported file type: {ext}. Please use a .pdf or .txt file.")

def extract_text_from_stream(file_stream, file_extension):
    if file_extension == ".pdf":
        reader = PdfReader(file_stream)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + " "
        return text
    elif file_extension == ".txt":
        return file_stream.read().decode("utf-8")
    else:
        raise ValueError("Unsupported file type. Please use a .pdf or .txt file.")

# -------------------------------
# 2. Sentence Segmentation
# -------------------------------
def get_sentences(text):
    doc = nlp(text)
    return [sent.text.strip() for sent in doc.sents if sent.text.strip()]

# -------------------------------
# 3. Cleaning for Classification
# -------------------------------
def clean_sentence(sentence):
    cleaned = re.sub(r"[^a-zA-Z]", " ", sentence).lower()
    return cleaned

# -------------------------------
# 4. Load Configurable Keywords
# -------------------------------
def load_section_keywords():
    # Use an absolute path for the configuration file
    config_file = os.path.join(os.path.dirname(__file__), "tender_config.json")
    if not os.path.exists(config_file):
        raise FileNotFoundError(f"Configuration file not found at {config_file}")
    with open(config_file, "r", encoding="utf-8") as f:
        return json.load(f)

# -------------------------------
# 5. Classify Sentences into Sections
# -------------------------------
def classify_sentence(sentence, section_keywords):
    cleaned = clean_sentence(sentence)
    for section, keywords in section_keywords.items():
        for kw in keywords:
            if kw in cleaned:
                return section
    return "Additional Information"

def classify_sentences(sentences, section_keywords):
    sections = {section: [] for section in section_keywords.keys()}
    sections["Additional Information"] = []
    for sentence in sentences:
        section = classify_sentence(sentence, section_keywords)
        sections[section].append(sentence)
    return sections

# -------------------------------
# 6. Assemble Final Structured Output Dynamically
# -------------------------------
def assemble_document(sections):
    output = []
    header = " RECONSTRUCTED TENDER DOCUMENT\n"
    output.append(header)
    
    toc = []
    for section, sentences in sections.items():
        if sentences:
            toc.append(section)
    if toc:
        output.append("TABLE OF CONTENTS")
        for idx, section in enumerate(toc, 1):
            output.append(f"{idx}. {section}")
        output.append("\n---\n")
    
    for section, sentences in sections.items():
        if sentences:
            output.append(f" {section.upper()}")
            for sent in sentences:
                try:
                    output.append(f"* {sent}")
                except UnicodeEncodeError as e:
                    print(f"Warning: Skipping a sentence due to encoding error: {e}", file=sys.stderr)
            output.append("")
    
    return "\n".join(output)

# -------------------------------
# 7. Main Processing Pipeline
# -------------------------------
def main():
    # Determine if we're using stdin or file path mode.
    if len(sys.argv) > 1 and sys.argv[1] == "--stdin":
        # In this mode, the file content is piped via stdin.
        print("Reading file content from stdin...", file=sys.stderr)

        # Get the file extension from the command-line arguments
        file_extension = None
        for arg in sys.argv:
            if arg.startswith("--ext="):
                file_extension = arg.split("=")[1].strip().lower()

        if not file_extension or file_extension not in [".pdf", ".txt"]:
            print(f"Error: Unsupported or missing file type: {file_extension}. Please use a .pdf or .txt file.", file=sys.stderr)
            sys.exit(1)

        try:
            file_stream = BytesIO(sys.stdin.buffer.read())
            all_text = extract_text_from_stream(file_stream, file_extension)
        except Exception as e:
            print(f"Error reading file content: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        # In file path mode, use the provided file path.
        if len(sys.argv) < 2:
            print("Usage: python summarizer.py <file_path>", file=sys.stderr)
            sys.exit(1)
        file_path = sys.argv[1]
        print(f"Received file path: {file_path}", file=sys.stderr)
        file_extension = os.path.splitext(file_path)[1].lower()
        if not file_extension:
            file_extension = guess_file_extension(file_path)
            print(f"Guessed file extension: {file_extension}", file=sys.stderr)
        else:
            print(f"File extension: {file_extension}", file=sys.stderr)
        if not os.path.exists(file_path):
            print(f"Error: File not found at {file_path}", file=sys.stderr)
            sys.exit(1)
        if file_extension not in [".pdf", ".txt"]:
            print(f"Error: Unsupported file type: {file_extension}. Please use a .pdf or .txt file.", file=sys.stderr)
            sys.exit(1)
        try:
            print("Extracting text...")
            all_text = extract_text(file_path)
        except Exception as e:
            print(f"Error extracting text: {e}", file=sys.stderr)
            sys.exit(1)

    try:
        print("Text extraction complete.", file=sys.stderr)
        print("Segmenting into sentences...", file=sys.stderr)
        sentences = get_sentences(all_text)
        print(f"Total sentences extracted: {len(sentences)}", file=sys.stderr)
        print("Loading section keywords...", file=sys.stderr)
        section_keywords = load_section_keywords()
        print("Classifying sentences into sections...", file=sys.stderr)
        sections = classify_sentences(sentences, section_keywords)
        print("Assembling final structured document dynamically...", file=sys.stderr)
        structured_doc = assemble_document(sections)
        print("\n=== Final Reconstructed Tender Document ===\n")
        print(structured_doc)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
