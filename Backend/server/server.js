const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const util = require('util');
const path = require('path'); // Import path module for resolving file paths
const { spawn } = require('child_process'); // Import child_process to run Python scripts

const unlinkAsync = util.promisify(fs.unlink);

const app = express();
app.use(cors());
const port = process.env.PORT || 5000;

// Ensure the uploads folder exists
const uploadFolder = path.resolve('uploads');
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
  console.log(`Created uploads folder at: ${uploadFolder}`);
}

// Configure multer for file upload
const upload = multer({ dest: uploadFolder });

app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  console.log('Uploaded file details:', req.file); // Log the uploaded file details
  const absoluteFilePath = path.resolve(req.file.path); // Resolve absolute file path
  console.log(`Resolved file path: ${absoluteFilePath}`); // Log the resolved file path

  try {
    // Check if the file exists
    if (!fs.existsSync(absoluteFilePath)) {
      console.error('File not found after upload:', absoluteFilePath);
      return res.status(500).json({ error: 'Uploaded file not found on the server.' });
    }

    // Call the Python script to process the PDF
    const pythonProcess = spawn('python', ['d:/Tender_summerizer/Backend/summarizer.py', absoluteFilePath]);

    let pythonOutput = '';
    let pythonError = '';

    pythonProcess.stdout.on('data', (data) => {
      console.log('Python script output:', data.toString()); // Log Python stdout
      pythonOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error('Python script :', data.toString()); // Log Python stderr
      pythonError += data.toString();
    });

    pythonProcess.on('close', async (code) => {
      console.log(`Python script exited with code ${code}`);
      // Delete the uploaded file after processing
      await unlinkAsync(req.file.path);

      if (code === 0) {
        console.log('Final output to be sent to frontend:', pythonOutput.trim()); // Log final output
        res.json({ clean_text: pythonOutput.trim() }); // Send the correct key expected by the frontend
      } else {
        console.error('Python script failed with error:', pythonError);
        res.status(500).json({ error: 'Failed to process the PDF file using Python script.', details: pythonError });
      }
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: 'Failed to process the PDF file.' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});