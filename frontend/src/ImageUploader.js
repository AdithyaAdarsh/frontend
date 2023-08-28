import React, { useState } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import './ImageUploader.css';

function ImageUploader({ setFilesUploaded }) {
  const [imageUrls, setImageUrls] = useState([]);
  const [moderationResults, setModerationResults] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFileChange = (event) => {
    const selectedFiles = event.target.files;
    const urls = Array.from(selectedFiles).map((file) =>
      URL.createObjectURL(file)
    );
    setImageUrls(urls);
  };

  const handleUpload = async () => {
    try {
      const selectedFiles = document.getElementById('imageFileInput').files;

      if (!selectedFiles.length) {
        console.error('No files selected');
        return;
      }

      const results = [];

      for (const file of selectedFiles) {
        const uuid = uuidv4();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('uuid', uuid);

        setUploadProgress((prevProgress) => ({ ...prevProgress, [uuid]: 0 })); // Initialize progress

        try {
          const response = await axios.post('http://localhost:5000/cms', formData, {
            onUploadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              setUploadProgress((prevProgress) => ({ ...prevProgress, [uuid]: progress }));
            },
          });

          console.log('Server Response:', response.data);

          // Process response and add to results...
        } catch (error) {
          console.error('Error uploading image:', error);
          // Handle error...
        }
      }

      setUploadProgress({}); // Reset progress
      setModerationResults(results);
      setUploadMessage('Files uploaded successfully');
    } catch (error) {
      console.error('Error:', error);
      setUploadMessage('Upload failed. Please try again.');
    }
  };

  const isUploadComplete = Object.keys(uploadProgress).length === imageUrls.length;
  const overallProgress = isUploadComplete
    ? 100
    : Math.round(
        (Object.values(uploadProgress).reduce((total, progress) => total + progress, 0) / imageUrls.length)
      );

  return (
    <div className="container">
      <h1>Image Moderation</h1>
      <div className="image-container">
        <form>
          <label htmlFor="imageFileInput" className="file-label">
            Choose Files
          </label>
          <input
            type="file"
            name="file"
            id="imageFileInput"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
          <button type="button" id="uploadButton" onClick={handleUpload}>
            Upload Images
          </button>
        </form>

        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${overallProgress}%` }}>
            {isUploadComplete ? '100%' : `${overallProgress}%`}
          </div>
        </div>

        <div className="image-preview-container">
          {imageUrls.map((imageUrl, index) => (
            <img
              key={index}
              src={imageUrl}
              alt={`Uploaded ${index}`}
              className="uploaded-image"
            />
          ))}
        </div>
      </div>

      {moderationResults.length > 0 && (
        <div className="result-container">
          {moderationResults.map((result, index) => (
            <div
              key={index}
              className={`status-container ${
                result.status.toLowerCase() === 'rejected'
                  ? 'status-rejected'
                  : 'status-approved'
              }`}
            >
              Image {index + 1} Moderation Status: {result.status}
            </div>
          ))}
        </div>
      )}

      {uploadMessage && (
        <div className={`upload-message ${uploadMessage.includes('successfully') ? 'upload-success' : 'upload-error'}`}>
          {uploadMessage}
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
