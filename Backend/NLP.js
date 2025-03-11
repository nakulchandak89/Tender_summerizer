const fs = require('fs');
const pdfParse = require('pdf-parse');
const natural = require('natural');
const stopword = require('stopword');
const lemmatizer = require('lemmatizer'); // Simple lemmatizer package

// Ensure a PDF file path is provided as a command-line argument
if (process.argv.length < 3) {
  console.error("No PDF file provided");
  process.exit(1);
}
const pdfPath = process.argv[2];

// Read the PDF file into a buffer
const dataBuffer = fs.readFileSync(pdfPath);

// Parse the PDF and process the text
pdfParse(dataBuffer)
  .then((data) => {
    let text = data.text;

    // Remove non-alphanumeric characters (except space) and convert to lowercase
    let cleaned = text.replace(/[^a-zA-Z0-9 ]/g, ' ').toLowerCase();

    // Tokenize the text using natural's WordTokenizer
    const tokenizer = new natural.WordTokenizer();
    let tokens = tokenizer.tokenize(cleaned);

    // Remove stopwords
    tokens = stopword.removeStopwords(tokens);

    // Lemmatize each token (using the lemmatizer package)
    let lemmatizedTokens = tokens.map(token => lemmatizer(token));

    // Join tokens to form the final cleaned text
    let finalText = lemmatizedTokens.join(' ');

    // Print the final text to stdout (captured by your Node.js server)
    console.log(finalText);
  })
  .catch((error) => {
    console.error("Error processing PDF: " + error);
    process.exit(1);
  });
