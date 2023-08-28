import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';
import axios from 'axios';
import { useModerateCount } from './ModerateCountContext';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [totalImageCount, setTotalImageCount] = useState(0);
  const { moderateCount, setModerateCount } = useModerateCount();
  const [isLoading, setIsLoading] = useState(false); // State to track loading state

  useEffect(() => {
    axios.get('http://localhost:5000/image_count')
      .then(response => {
        setTotalImageCount(response.data.imageCount);
      })
      .catch(error => {
        console.error('Error fetching image count:', error);
      });
  }, []);

  const handleLogin = () => {

    if (username && password && moderateCount > 0) {
      setIsLoading(true); // Set loading state to true

      axios.post('http://localhost:5000/login', { username, password, moderate_count: moderateCount })
        .then(response => {
          if (response.data.message === 'Login successful') {
            onLogin(username);
            setUsername(username);
            navigate('/customer_service');
          } else {
            setErrorMessage('Invalid username or password');
          }
        })
        .catch(error => {
          console.error('Login error:', error);
          setErrorMessage('Username or password incorrect');
        })
        .finally(() => {
          setIsLoading(false); // Reset loading state
        });
    } else {
      setErrorMessage('Username, password, and a valid number of images to moderate are required');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>
        <p>Total Number of Images Pending: {totalImageCount}</p>
        <input
          type="number"
          placeholder="Number of Images to Moderate"
          value={moderateCount}
          onChange={(e) => setModerateCount(e.target.value)}
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="login-button"
          disabled={isLoading} // Disable the button when a request is in progress
        >
          {isLoading ? 'Logging In...' : 'Log In'} {/* Display appropriate text */}
        </button>
        <Link to="/register" className="register-link">
          Don't have an account? Register here
        </Link>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default Login;
