import os
import re
import nltk
import PyPDF2
import torch
import sys
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from transformers import T5Tokenizer, T5ForConditionalGeneration

# Download necessary NLTK data
# nltk.download('punkt')  
# nltk.download('stopwords')
# nltk.download('wordnet')
# nltk.download('omw-1.4')  # Required for WordNet
# nltk.download('punkt_tab')

# Load NLP Model (T5 for text generation)
tokenizer = T5Tokenizer.from_pretrained("t5-small")
model = T5ForConditionalGeneration.from_pretrained("t5-small")

# Predefined stopwords
sw = set(stopwords.words('english'))

def extract_text_from_pdf(pdf_path):
    """Extract text from a local PDF file."""
    text = ""
    with open(pdf_path, "rb") as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page in pdf_reader.pages:
            text += page.extract_text() + " "
    return text.strip()

def clean_text(text):
    """Clean text by removing special characters and stopwords."""
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)  # Remove special characters
    text = text.lower()  # Convert to lowercase
    words = word_tokenize(text)  # Tokenize words
    clean_words = [word for word in words if word not in sw]  # Remove stopwords
    return ' '.join(clean_words)


def generate_text(cleaned_text):
    """Generate new text using T5 NLP model."""
    input_text = "summarize: " + cleaned_text  # T5 works well with "summarize:" prefix
    inputs = tokenizer(input_text, return_tensors="pt", max_length=5028, truncation=True)
    summary_ids = model.generate(inputs.input_ids, max_length=1028, num_beams=4, early_stopping=True)
    return tokenizer.decode(summary_ids[0], skip_special_tokens=True)

# Set stopwords
sw = set(stopwords.words('english'))

def clean_text(text):
    """Clean text by removing special characters and stopwords."""
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)  # Remove special characters
    text = text.lower()  # Convert to lowercase
    words = word_tokenize(text)  # Tokenize words
    clean_words = [word for word in words if word not in sw]  # Remove stopwords
    return ' '.join(clean_words)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: No PDF file path provided.", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]  # Get the PDF file path from command-line arguments
    print(f"Received PDF file path: {pdf_path}", file=sys.stderr)  # Log the received file path

    try:
        # Check if the file exists
        if not os.path.exists(pdf_path):
            print(f"Error: File not found at {pdf_path}", file=sys.stderr)
            sys.exit(1)

        print(f"Processing PDF file: {pdf_path}", file=sys.stderr)

        # Step 1: Extract Text
        raw_text = extract_text_from_pdf(pdf_path)
        if not raw_text.strip():
            print("Error: No text extracted from the PDF.", file=sys.stderr)
            sys.exit(1)
        print("Text extraction successful.", file=sys.stderr)

        # Step 2: Clean Text
        cleaned_text = clean_text(raw_text)
        print("Text cleaning successful.", file=sys.stderr)

        # Step 3: Generate Summary/Text
        generated_text = generate_text(cleaned_text)
        print("Summary generation successful.", file=sys.stderr)

        # Log the final summary
        print(f"Generated Summary: {generated_text}", file=sys.stderr)

        # Print the generated summary (this will be sent back to Node.js)
        print(generated_text)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)