const fs = require('fs');
const pdf = require('pdf-parse');
const { T5Tokenizer, T5ForConditionalGeneration } = require('@xenova/transformers');

// Define a basic set of English stopwords
const stopwords = new Set([
  "i", "me", "my", "myself", "we", "our", "ours", "ourselves",
  "you", "your", "yours", "yourself", "yourselves", "he", "him",
  "his", "himself", "she", "her", "hers", "herself", "it", "its",
  "itself", "they", "them", "their", "theirs", "themselves", "what",
  "which", "who", "whom", "this", "that", "these", "those", "am",
  "is", "are", "was", "were", "be", "been", "being", "have", "has",
  "had", "having", "do", "does", "did", "doing", "a", "an", "the",
  "and", "but", "if", "or", "because", "as", "until", "while", "of",
  "at", "by", "for", "with", "about", "against", "between", "into",
  "through", "during", "before", "after", "above", "below", "to",
  "from", "up", "down", "in", "out", "on", "off", "over", "under",
  "again", "further", "then", "once", "here", "there", "when", "where",
  "why", "how", "all", "any", "both", "each", "few", "more", "most",
  "other", "some", "such", "no", "nor", "not", "only", "own", "same",
  "so", "than", "too", "very", "s", "t", "can", "will", "just", "don",
  "should", "now"
]);

/**
 * Extract text from a PDF file.
 * @param {string} pdfPath - Path to the PDF file.
 * @returns {Promise<string>} Extracted text.
 */
async function extractTextFromPDF(pdfPath) {
  try {
    console.log('Extracting text from PDF:', pdfPath);
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    console.log('Text extraction successful.');
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF.');
  }
}

/**
 * Clean text by removing special characters, lowercasing, and removing stopwords.
 * @param {string} text - The raw text.
 * @returns {string} Cleaned text.
 */
function cleanText(text) {
  try {
    console.log('Cleaning extracted text...');
    let cleaned = text.replace(/[^a-zA-Z0-9\s]/g, '');
    cleaned = cleaned.toLowerCase();
    let words = cleaned.split(/\s+/);
    let filtered = words.filter(word => word && !stopwords.has(word));
    console.log('Text cleaning successful.');
    return filtered.join(' ');
  } catch (error) {
    console.error('Error cleaning text:', error);
    throw new Error('Failed to clean text.');
  }
}

/**
 * Generate a summary using T5-small model.
 * @param {string} cleanedText - The cleaned text.
 * @returns {Promise<string>} Generated summary.
 */
async function generateText(cleanedText) {
  try {
    console.log('Generating summary using T5-small model...');
    console.log('Input to the model:', cleanedText); // Log the input text

    const tokenizer = await T5Tokenizer.fromPretrained('t5-small');
    const model = await T5ForConditionalGeneration.fromPretrained('t5-small');

    const inputText = "summarize: " + cleanedText;
    console.log('Formatted input for tokenizer:', inputText); // Log the formatted input

    const inputs = await tokenizer(inputText, { max_length: 512, truncation: true });
    console.log('Tokenized input:', inputs); // Log the tokenized input

    const output = await model.generate(inputs.input_ids, {
      max_length: 150,
      num_beams: 4,
      early_stopping: true
    });

    console.log('Raw model output:', output); // Log the raw output from the model

    const summary = await tokenizer.decode(output[0], { skip_special_tokens: true });
    console.log('Decoded summary:', summary); // Log the decoded summary
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate summary.');
  }
}

// Export the main function to be used in the backend
module.exports = async function processPDF(pdfPath) {
  try {
    console.log('Processing PDF:', pdfPath);
    const rawText = await extractTextFromPDF(pdfPath);
    const cleanedText = cleanText(rawText);
    const summary = await generateText(cleanedText);
    console.log('PDF processing complete.');
    return summary;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw error;
  }
};