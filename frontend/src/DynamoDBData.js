import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DynamoDBData.css';
import { useLocation } from 'react-router-dom'; // Import useLocation hook
import { useModerateCount } from './ModerateCountContext';
import jwt_decode from 'jwt-decode';



const DynamoDBData = () => {
  const [usernameError, setUsernameError] = useState(false);
  const [reasonError, setReasonError] = useState(false);
  const [data, setData] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showReasonPopup, setShowReasonPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reasonInput, setReasonInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [uuids, setUuids] = useState([]); // State to store UUIDs
  const { moderateCount } = useModerateCount();
  const [newImages, setNewImages] = useState([]); 
  const [newImageCount, setNewImageCount] = useState([]);
  const [fetchedImageUUIDs, setFetchedImageUUIDs] = useState([]);
  const [imageCount, setImageCount] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const { username } = location.state || {};
  const token = localStorage.getItem('token'); 
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  useEffect(() => {
    console.log('DynamoDBData component rendered');
      fetchDataFromServer();
   // Set to true after initial rendering
  
  }, []);

  const fetchImageCount = () => {
    axios.get('http://localhost:5000/image_count')
      .then(response => {
        setImageCount(response.data.imageCount);
      })
      .catch(error => {
        console.error('Error fetching image count:', error);
      });
  };



  const fetchDataFromServer = () => {
    // Retrieve the session token and username from local storage
    const sessionToken = localStorage.getItem('token');
    console.log("The session token is:", sessionToken);
  
    if (!sessionToken) {
      console.error('Session token not found');
      return;
    }
  
    const headers = {
      'Authorization': `Bearer ${sessionToken}`,
    };
  
    axios.get(`http://localhost:5000/fetch_new_images?moderate_count=${moderateCount}`, { headers })
      .then(response => {
        if (Array.isArray(response.data)) {
          setData(response.data);
          const uuidList = response.data.map(item => item.UUID);
          setUuids(uuidList);
          console.log('the moderate_count is :', moderateCount);
          console.log("UUID List:", uuidList);
        } else {
          console.error("Response data is not an array:", response.data);
        }
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      })
      .finally(() => {
        setIsLoading(false); // Reset loading state
      });
  };
  
  
  
  
  
  

  const fetchImagesByUUIDs = (uuidList) => {
    axios
      .post('http://localhost:5000/fetch_images_by_uuid', { uuids: uuidList })
      .then(response => {
        // Update state with the received images
        setData(response.data);
      })
      .catch(error => {
        console.error('Error fetching images:', error);
      });
  };

  const resetFetchedImageUUIDs = () => {
    setFetchedImageUUIDs([]); // Reset the fetched image UUIDs in local state
    // Get the token from local storage or wherever you are storing it
    const token = localStorage.getItem('token');
    
    // Check if the token is available
    if (token) {
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      // Send a request to the server to clear the fetched UUIDs on the backend
      axios.post('http://localhost:5000/reset_fetched_uuids', null, { headers })
        .then(response => {
          console.log('Fetched UUIDs reset:', response.data);
        })
        .catch(error => {
          console.error('Error resetting fetched UUIDs:', error);
        });
    } else {
      console.error('Token not available.');
    }
  };
  
  
  



  const handleManualReview = (item) => {
    setSelectedItem(item);
    setShowReasonPopup(true);
    setReasonInput('');

    // Set the initial status based on the current status of the item
    const initialStatus = item.Manual_Status || item.Moderation_Results;
    setSelectedStatus(initialStatus);
  };


  const handlePopupCancel = () => {
    setShowReasonPopup(false);
    setSelectedItem(null);
  };

  const handlePageRefresh = () => {
    resetFetchedImageUUIDs();
    // You can also perform any other necessary cleanup here
  };

  useEffect(() => {
    //fetchDataFromServer();
  
    // Add an event listener for page refresh
    window.addEventListener('beforeunload', handlePageRefresh);
  
    // Remove the event listener when the component unmounts
    return () => {
      resetFetchedImageUUIDs(); // Reset fetched UUIDs when the component unmounts
      window.removeEventListener('beforeunload', handlePageRefresh);
    };
  }, []);


  const fetchNewImages = () => {
    // Get the JWT token from your storage (localStorage or sessionStorage)
    const token = localStorage.getItem('token'); // Replace with your storage method
  
    // Configure headers with the JWT token
    const headers = {
      Authorization: `Bearer ${token}`
    };
  
    axios.get(`http://localhost:5000/fetch_new_images?count=${newImageCount}&uuids=${uuids.join(',')}`, { headers })
      .then(response => {
        if (response.data.message) {
          alert(response.data.message);
        } else {
          const newImagesData = response.data;
          setNewImages(prevImages => [...prevImages, ...newImagesData]);
        }
      })
      .catch(error => {
        console.error('Error fetching new images:', error);
      });
  };
  
  
  

  const handleReasonSubmit = (status) => {
    if (selectedItem && reasonInput.trim() !== '') {
      // Reset error states
      setUsernameError(false);
      setReasonError(false);
  
      const timestamp = new Date().toISOString();
      const formattedTimestamp = `(${timestamp})`;
      const updatedReason = `${selectedItem.reason_for_change || ''}\n${reasonInput} ${formattedTimestamp} (by ${username|| usernameInput})`;
  
      const updatedItem = {
        uuid: selectedItem.UUID,
        manual_status: status, // Use the provided status (Approved or Rejected)
        reason_for_change: updatedReason,
        username: username || usernameInput,
      };
  
      axios
        .post('http://localhost:5000/update_manual_status', updatedItem)
        .then(response => {
          console.log('Update successful:', response.data);
  
          // Fetch images by UUIDs using the POST method
          console.log("The uuids are:", uuids);
          fetchImagesByUUIDs(uuids);
  
          // Check if the selectedItem is in the newImages array and update its status
          const updatedNewImages = newImages.map(img =>
            img.UUID === selectedItem.UUID
              ? { ...img, Manual_Status: status, Reason_For_Change: updatedReason, username: updatedItem.username }
              : img
          );
  
          // Update the state with the updated newImages
          setNewImages(updatedNewImages);
  
          setShowReasonPopup(false);
          setSelectedItem(null);
        })
        .catch(error => {
          console.error('Error updating status:', error);
        });
    } else {
      // Set error states if inputs are empty
      if (!usernameInput.trim()) {
        setUsernameError(true);
      }
      if (!reasonInput.trim()) {
        setReasonError(true);
      }
    }
  };
  
   
  
  

  return (
<div className="container">
  <h1>Moderation Results</h1>
  
  <div className="center-buttons">
    <button className="refresh-button" onClick={fetchImageCount}>
      Refresh Image Count: {imageCount}
    </button>
    <br></br>
    <div className="center-input-button">
        <input
          type="number"
          value={newImageCount}
          onChange={event => setNewImageCount(parseInt(event.target.value))}
          placeholder="Enter number of new images"
          className="new-images-input"
        />
        <button className="fetch-button" onClick={fetchNewImages}>
          Fetch New Images
        </button>
      </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>File Name</th>
        <th>AWS Results</th>
        <th>TenantID</th>
        <th>UUID</th>
        <th>Reason</th>
        <th>Manual Status</th>
        <th>Reason for Change</th>
        <th>Image</th>
        <th>Change Status</th>
      </tr>
    </thead>
    <tbody>
          {data?.length > 0 ? (
            data.map((item, index) => (
              <tr key={index}>
                <td>{item.file_name}</td>
                <td className={item.Moderation_Results === 'Approved' ? 'approved text-success' : 'text-danger'}>
                  {item.Moderation_Results}
                </td>
                <td>{item.TenantID}</td>
                <td>{item.UUID}</td>
                <td>
                  {item.Reason && JSON.parse(item.Reason).moderation_labels ? JSON.parse(item.Reason).moderation_labels.map(label => label.Name).join(', ') : 'NIL'}
                </td>
                <td>
                <span
                    className={`status-label ${
                      item.Manual_Status === 'Approved'
                        ? 'approved'
                        : item.Manual_Status === 'Pending' // Apply the "pending" class when Manual_Status is "Pending"
                        ? 'pending' 
                        : 'rejected'
                    }`}
                    >

                    {item.Manual_Status ? item.Manual_Status : item.Moderation_Results}
                  </span>
                </td>
                <td>
                  {item.Reason_For_Change ? item.Reason_For_Change.split('\n').map((line, index) => (
                    <div key={index}>{line}</div>
                  )) : 'N/A'}
                </td>
                <td>
                  <img
                    src={`https://gc-cms-test-bucket.s3.ap-south-1.amazonaws.com/${item.file_name}`}
                    alt={`Preview of ${item.file_name}`}
                    className="preview-image"
                    onClick={() =>
                      setSelectedImage(`https://gc-cms-test-bucket.s3.ap-south-1.amazonaws.com/${item.file_name}`)
                    }
                  />
                </td>
                <td>
                  <button onClick={() => handleManualReview(item)} className="btn btn-outline-info">
                    Change Status
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              
            </tr>
          )}
    {newImages?.length > 0 &&
    newImages.map((item, index) => (
      <tr key={`new-${index}`}>
        <td>{item.file_name}</td>
        <td
          className={
            item.Moderation_Results === 'Approved'
              ? 'approved text-success'
              : 'text-danger'
          }
        >
          {item.Moderation_Results}
        </td>
        <td>{item.TenantID}</td>
        <td>{item.UUID}</td>
        <td>
          {item.Reason &&
          JSON.parse(item.Reason).moderation_labels ? (
            JSON.parse(item.Reason).moderation_labels.map(
              (label, labelIndex) => (
                <span key={labelIndex}>{label.Name}, </span>
              )
            )
          ) : (
            'NIL'
          )}
        </td>
        <td>
          <span
            className={`status-label ${
              item.Manual_Status === 'Approved'
                ? 'approved'
                : 'rejected'
            }`}
          >
            {item.Manual_Status ? item.Manual_Status : item.Moderation_Results}
          </span>
        </td>
        <td>
          {item.Reason_For_Change
            ? item.Reason_For_Change.split('\n').map((line, index) => (
                <div key={index}>{line}</div>
              ))
            : 'N/A'}
        </td>
        <td>
          <img
            src={`https://gc-cms-test-bucket.s3.ap-south-1.amazonaws.com/${item.file_name}`}
            alt={`Preview of ${item.file_name}`}
            className="preview-image"
            onClick={() =>
              setSelectedImage(
                `https://gc-cms-test-bucket.s3.ap-south-1.amazonaws.com/${item.file_name}`
              )
            }
          />
        </td>
        <td>
          <button onClick={() => handleManualReview(item)} className="button">
            Change Status
          </button>
        </td>
      </tr>
    ))}
        </tbody>
      </table>
      {selectedImage && (
        <div className="image-preview-popup">
          <img src={selectedImage} alt="Selected Preview" />
          <button onClick={() => setSelectedImage(null)}>Close Preview</button>
        </div>
      )}
      {showReasonPopup && selectedItem && (
        <div className="popup">
  <div className="popup-content">
    <span className="close" onClick={handlePopupCancel}>&times;</span>
    <h2>Reason for Status Change</h2>
    <div className="popup-form">
    <div className={`input-container ${usernameError ? 'error' : ''}`}>
      <label htmlFor="usernameInput">Name:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>
      <input
        type="text"
        id="usernameInput"
        value={usernameInput}
        onChange={event => setUsernameInput(event.target.value)}
        placeholder="Enter your username"
      />
      {usernameError && <div className="error-message">Please enter a username.</div>}
    </div>
    <div className={`input-container ${reasonError ? 'error' : ''}`}>
      <label htmlFor="reasonInput">Reason:&nbsp;&nbsp;</label>
      <textarea
        id="reasonInput"
        value={reasonInput}
        onChange={event => setReasonInput(event.target.value)}
        placeholder="Enter reason here..."
      />
      {reasonError && <div className="error-message">Please enter a reason.</div>}
    </div>
      <div className="popup-buttons">
  <button onClick={() => handleReasonSubmit('Approved')} className="approve-button">
    Approve
  </button>
  <button onClick={() => handleReasonSubmit('Rejected')} className="reject-button">
    Reject
  </button>
  <button onClick={handlePopupCancel} className="cancel">Cancel</button>
</div>
    </div>
  </div>
</div>

      )}
    </div>
  );
};
export const resetFetchedImageUUIDs = () => {
  // Your existing implementation of resetFetchedImageUUIDs function
};
export default DynamoDBData;