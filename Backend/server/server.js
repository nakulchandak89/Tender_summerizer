const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
app.use(cors());
const port = process.env.PORT || 5000;

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  console.log(`File uploaded: ${req.file.originalname}`);
  console.log(`File saved at: ${req.file.path}`);

  // Define the path to your JavaScript NLP script (update the path as needed)
  const scriptPath = 'd:/Tender_summerizer/Backend/NLP_model.js';

  // Check if the JavaScript script exists
  if (!fs.existsSync(scriptPath)) {
    console.error(`JavaScript script not found at: ${scriptPath}`);
    return res.status(500).json({ error: `JavaScript script not found at: ${scriptPath}` });
  }

  // Spawn the Node.js process to run NLP_model.js
  const processInstance = spawn('node', [scriptPath, req.file.path]);
  let cleanText = '';

  // Capture stdout from NLP_model.js
  processInstance.stdout.on('data', (data) => {
    console.log(`Node.js stdout: ${data}`);
    cleanText += data.toString();
  });

  // Capture any stderr (errors/logs) from NLP_model.js
  processInstance.stderr.on('data', (data) => {
    console.error(`Node.js stderr: ${data}`);
  });

  // On process close, return the result or error
  processInstance.on('close', (code) => {
    // Remove the uploaded file if desired (optional)
    try {
      fs.unlinkSync(req.file.path);
    } catch (unlinkErr) {
      console.error(`Error deleting file: ${unlinkErr}`);
    }

    if (code !== 0) {
      console.error(`Node.js process exited with code ${code}`);
      return res.status(500).json({ error: 'Failed to process the PDF file.' });
    }

    console.log('File uploaded and processed successfully.');
    // Return the cleaned text to the frontend
    res.json({ clean_text: cleanText });
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
