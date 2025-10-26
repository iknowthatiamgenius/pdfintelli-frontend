import { useState } from 'react';
import axios from 'axios';

const FileUpload = ({ onFileUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file) => {
    if (!file.type.includes('pdf')) {
      alert('Please upload a PDF file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      onFileUploaded(response.data);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      className={`upload-zone ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: '2px dashed #ccc',
        borderRadius: '10px',
        padding: '40px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s',
        backgroundColor: isDragging ? '#f0f8ff' : '#fafafa'
      }}
    >
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        id="file-input"
      />
      
      {uploading ? (
        <div>
          <div>📤 Uploading...</div>
        </div>
      ) : (
        <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <h3>Drop your PDF here or click to browse</h3>
          <p>Supported format: PDF</p>
        </label>
      )}
    </div>
  );
};

export default FileUpload;