import sys
import os
from flask import Flask, request, jsonify
import PyPDF2
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer



app = Flask(__name__)
sw = set(stopwords.words('english'))

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and file.filename.endswith('.pdf'):
        try:
            text = ''
            pdf_reader = PyPDF2.PdfFileReader(file)
            for page_num in range(pdf_reader.numPages):
                text += pdf_reader.getPage(page_num).extract_text()
            
            rev = re.sub('[^a-zA-Z0-9]', ' ', text)
            rev = rev.lower()

            lemmatizer = WordNetLemmatizer()
            words = nltk.word_tokenize(rev)
            clean_words = [lemmatizer.lemmatize(word) for word in words if word.lower() not in sw]
            clean_text = ' '.join(clean_words)

            vectorizer = TfidfVectorizer()
            X = vectorizer.fit_transform([clean_text])

            return jsonify({"clean_text": clean_text}), 200
        except PyPDF2.utils.PdfReadError as e:
            app.logger.error(f"PDF read error: {e}")
            return jsonify({"error": f"PDF read error: {e}"}), 500
        except Exception as e:
            app.logger.error(f"Error processing file: {e}")
            return jsonify({"error": f"Error processing file: {e}"}), 500
    else:
        return jsonify({"error": "Invalid file type"}), 400

if __name__ == '__main__':
    app.run(debug=True)