import React, { useState, useRef } from 'react';
import axios from 'axios';
import './app.css';

function App() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const onFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onFileUpload = async () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.clean_text) {
        setResponse(res.data.clean_text); // Use the clean_text key from the backend response
      } else {
        setResponse('Unexpected response from the server.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setResponse('Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Upload and Preview Section */}
      <div className="upload-preview-section">
        <div className="upload-section">
          <h1 className="main-heading">Tender Summarizer</h1>
          <p className="subheading">
            Summarize your tender documents quickly and easily in one place.
          </p>

          <button className="primary-button" onClick={handleSelectFile}>
            <i className="fas fa-file-upload"></i> Select PDF files
          </button>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={onFileChange}
            accept="application/pdf"
          />

          {file && <p className="selected-file">Selected file: {file.name}</p>}

          <button className="upload-button" onClick={onFileUpload} disabled={loading}>
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>

      {/* Summarized Text Section */}
      <div className="summarized-text-section">
        <h2>Summary Response</h2>
        <div className="response-card">
          {loading ? (
            <div className="loader"></div>
          ) : response ? (
            <pre style={{ whiteSpace: 'pre-wrap' }}>{response}</pre>
          ) : (
            <p className="placeholder-text">Summrized text will displayed hear .</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;