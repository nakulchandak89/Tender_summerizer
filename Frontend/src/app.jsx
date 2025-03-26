import React, { useState, useRef } from 'react';
import { FileText, Upload, Download, AlertTriangle, Loader2 } from 'lucide-react';
import axios from 'axios';
import './app.css';

function App() {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const onFileChange = (event) => {
    const selectedFile = event.target.files[0];
    
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
      setError(null);
    } else {
      setFile(null);
      setFilePreview(null);
      setError('Please upload a valid PDF file.');
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const onFileUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.clean_text) {
        setResponse(res.data.clean_text);
      } else {
        setError('Unable to generate summary. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Error processing the document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const response = await axios.get('http://localhost:5000/download', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tender_summary.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('Failed to download the summary PDF.');
    }
  };

  return (
    <div className="container">
      <div className="upload-preview-container">
        <div className="upload-section">
          <h1 className="main-heading">Tender Document Summarizer</h1>
          <p className="subheading">
            Professional Document Analysis Tool
          </p>

          {error && (
            <div className="error-message">
              <AlertTriangle size={20} />
              {error}
            </div>
          )}

          <button 
            className="primary-button" 
            onClick={handleFileSelect}
          >
            <FileText size={18} style={{marginRight: 10}} /> 
            Select PDF Document
          </button>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={onFileChange}
            accept="application/pdf"
          />

          {file && (
            <p className="selected-file">
              Selected: {file.name}
            </p>
          )}

          <button 
            className="upload-button" 
            onClick={onFileUpload} 
            disabled={loading || !file}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{marginRight: 10}} /> 
                Processing...
              </>
            ) : (
              <>
                <Upload size={18} style={{marginRight: 10}} /> 
                Upload Document
              </>
            )}
          </button>
        </div>

        {filePreview && (
          <div className="preview-section">
            <h2 style={{
              textAlign: 'center', 
              color: '#2C3E50', 
              marginBottom: 15,
              borderBottom: '1px solid #3498DB',
              paddingBottom: 10
            }}>
              PDF Preview
            </h2>
            <iframe
              src={filePreview}
              title="PDF Preview"
              style={{border: '1px solid #E0E0E0', borderRadius: 4}}
            ></iframe>
          </div>
        )}
      </div>

      <div className="summarized-text-section">
        <h2 style={{
          textAlign: 'center', 
          color: '#2C3E50', 
          margin: '20px 0',
          borderBottom: '1px solid #3498DB',
          paddingBottom: 10
        }}>
          Summary Results
        </h2>
        <div className="response-card">
          {loading ? (
            <div style={{
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%'
            }}>
              <Loader2 size={50} color="#3498DB" />
            </div>
          ) : response ? (
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word',
              color: '#2C3E50'
            }}>
              {response.replace(/["\[\]]/g, '')}
            </pre>
          ) : (
            <p className="placeholder-text">
              Upload a tender document to generate a professional summary
            </p>
          )}
        </div>

        {response && (
          <div style={{
            display: 'flex', 
            justifyContent: 'center', 
            margin: '20px 0'
          }}>
            <button 
              className="summarize-button" 
              onClick={downloadPDF}
              style={{
                maxWidth: '250px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <Download size={18} /> 
              Download Summary
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;