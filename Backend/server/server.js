const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { spawn } = require('child_process'); // Import child_process to run Python scripts

const app = express();
app.use(cors());
const port = process.env.PORT || 5000;

// Configure multer for file upload (in memory)
const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  console.log('Uploaded file details:', req.file.originalname); // Log the uploaded file name
  const originalExtension = req.file.originalname.split('.').pop().toLowerCase(); // Get the original file extension

  console.log(`File extension: .${originalExtension}`); // Log the file extension

  try {
    // Validate file extension
    if (originalExtension !== 'pdf' && originalExtension !== 'txt') {
      console.error('Unsupported file type:', originalExtension);
      return res.status(400).json({ error: 'Unsupported file type. Please upload a .pdf or .txt file.' });
    }

    // Call the Python script and pass the file content via stdin along with the file extension
    console.log('Calling Python script...');
    const pythonProcess = spawn('python', ['d:/Tender_summerizer/Backend/summarizer.py', '--stdin', `--ext=.${originalExtension}`]);

    let pythonOutput = '';
    let pythonError = '';

    // Write the file buffer to the Python script's stdin
    pythonProcess.stdin.write(req.file.buffer);
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
      console.log('Python script output:', data.toString()); // Log Python stdout
      pythonOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error('Python script :', data.toString()); // Log Python stderr
      pythonError += data.toString();
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python script exited with code ${code}`);
      if (code === 0) {
        console.log('Final output to be sent to frontend:', pythonOutput.trim()); // Log final output
        res.json({ clean_text: pythonOutput.trim() }); // Send the output as an object with a clean_text key
      } else {
        console.error('Python script failed with error:', pythonError);
        res.status(500).json({ error: 'Failed to process the file using Python script.', details: pythonError });
      }
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Failed to process the file.' });
  }
});

app.get('/download', (req, res) => {
  const filePath = 'summary.pdf'; // Path to the generated PDF file
  res.download(filePath, (err) => {
    if (err) {
      console.error('Error sending the PDF file:', err);
      res.status(404).json({ error: 'Failed to download the PDF file.' });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});