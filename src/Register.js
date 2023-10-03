import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css'; 
import axios from 'axios';

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationMessage, setRegistrationMessage] = useState('');

  const handleRegister = () => {
    if (username && password && confirmPassword) {
      if (password !== confirmPassword) {
        setRegistrationMessage('Passwords do not match');
        return;
      }
  
      axios.post('http://localhost:5000/register', { username, password })
        .then(response => {
          console.log(response.data); // Registration successful
          setRegistrationMessage('Registration successful! You can now log in.');
        })
        .catch(error => {
          console.error('Registration error:', error);
          if (error.response && error.response.data && error.response.data.error === 'Username already exists') {
            setRegistrationMessage('Username is already taken. Please choose a different username.');
          } else {
            setRegistrationMessage('An error occurred during registration');
          }
        });
    } else {
      setRegistrationMessage('All fields are required');
    }
  };
  

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Register</h2>
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
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button onClick={handleRegister} className="register-button">
          Register
        </button>
        <Link to="/" className="login-link">
          Already have an account? Log in here
        </Link>
        {registrationMessage && <p className="registration-message">{registrationMessage}</p>}
      </div>
    </div>
  );
};

export default Register;
