import React, { useState, useRef } from 'react';
import axios from 'axios';
import './app.css';
import TiltedCard from './TiltedCard';
import nakulImage from './assets/Nakul.jpg'; 
import vedantimg  from './assets/vedant.jpg';
import shauriyaimg from './assets/shauriya.jpg';

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
      setResponse(res.data.clean_text);
    } catch (error) {
      console.error('Error uploading file:', error);
      setResponse('Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Landing Section */}
      <div className="landing-section">
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

      {response && (
        <div className="response-section">
          <h2>Summary Response</h2>
          <div className="response-card">
            {loading ? <div className="loader"></div> : <p>{response}</p>}
          </div>
        </div>
      )}

      {/* About Us Section Restored */}
      <div className="about-section">
        <h2>About Us</h2>
        <p>
          We are a team of passionate developers dedicated to providing efficient solutions for document summarization.
          Our goal is to simplify tender document analysis using AI-powered tools.
        </p>
      

      <div className="team-cards">
        {/* Team Member 1 */}
        <TiltedCard
          imageSrc="path/to/photo2.jpg"
          altText="Shriram Dixit"
          captionText="Sr Developer"
          containerHeight="300px"
          containerWidth="200px"
          imageHeight="300px"
          imageWidth="200px"
          rotateAmplitude={12}
          scaleOnHover={1.2}
          showMobileWarning={false}
          showTooltip={true}
          displayOverlayContent={true}
          overlayContent={
            <div style={{ textAlign: 'left' }}>
              <p style={{ color: 'black', fontWeight: 'bold' }}>Shriram Dixit</p>
              <a href="https://www.linkedin.com/in/member2" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-linkedin" style={{ fontSize: '2.5rem' }}></i>
              </a>
              <br />
              <a href="https://github.com/member2" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-github" style={{ fontSize: '2.5rem', color: 'black' }}></i>
              </a>
            </div>
          }
        />

        {/* Additional Team Members */}
        <TiltedCard
          imageSrc={vedantimg}
          altText="Vedant Pandhre"
          captionText="Project Manager"
          containerHeight="300px"
          containerWidth="200px"
          imageHeight="300px"
          imageWidth="200px"
          rotateAmplitude={12}
          scaleOnHover={1.2}
          showMobileWarning={false}
          showTooltip={true}
          displayOverlayContent={true}
          overlayContent={
            <div style={{ textAlign: 'left' }}>
              <p style={{ color: '#D70654', fontWeight: 'bold' }}>Vedant Pandhre</p>
              <a href="http://www.linkedin.com/in/vedant-pandhare" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-linkedin" style={{ fontSize: '2.5rem' }}></i>
              </a>
              <br />
              <a href="https://github.com/Vedant-ops117" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-github" style={{ fontSize: '2.5rem', color: 'black' }}></i>
              </a>
            </div>
          }
        />
           {/* Team Member 3 */}
           <TiltedCard
             imageSrc={nakulImage}
             altText="Nakul Chandak"
             captionText="Jr Developer"
             containerHeight="300px"
             containerWidth="200px"
             imageHeight="300px"
             imageWidth="200px"
             rotateAmplitude={12}
             scaleOnHover={1.2}
             showMobileWarning={false}
             showTooltip={true}
             displayOverlayContent={true}
             overlayContent={
               <div style={{ textAlign: 'left' }}>
                 <p style={{ color: '#FB4141', fontWeight: 'bold' }}>Nakul Chandak</p>
                 <a href="https://www.linkedin.com/in/nakul-chandak-7280151b8" target="_blank" rel="noopener noreferrer">
                   <i className="fab fa-linkedin" style={{ fontSize: '2.5rem' }}></i>
                 </a>
                 <br />
                 <a href="https://github.com/nakulchandak89" target="_blank" rel="noopener noreferrer">
                   <i className="fab fa-github" style={{ fontSize: '2.5rem', color: 'black' }}></i>
                 </a>
               </div>
            }
          />

          {/* Team Member 4 */}
          <TiltedCard
            imageSrc={shauriyaimg}
            altText="Shauriya Ahire "
            captionText="Data Analytics"
            containerHeight="300px"
            containerWidth="200px"
            imageHeight="300px"
            imageWidth="200px"
            rotateAmplitude={12}
            scaleOnHover={1.2}
            showMobileWarning={false}
            showTooltip={true}
            displayOverlayContent={true}
            overlayContent={
              <div style={{ textAlign: 'left' }}>
              <p style={{ color: '#FB4141',backgroundcolor:'black', fontWeight: 'bold' }}>Shauriya Ahire</p>
              <a href="https://www.linkedin.com/in/shaurya-ahire-b55800312?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-linkedin" style={{ fontSize: '2.5rem' }}></i>
              </a>
              
            </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
export default App;