import React, { useState } from 'react';
import './styles.css';
import ImageUploader from './ImageUploader';
import DynamoDBData from './DynamoDBData';
import Register from './Register';
import Login from './Login';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { ModerateCountProvider } from './ModerateCountContext'; // Import the context

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (username) => {
    setUser(username);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    
    <ModerateCountProvider> {/* Wrap Router with the context provider */}
    <Router>
      <div className="App">
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
          <Link to="/" className="navbar-brand">
            Home
          </Link>
          <ul className="navbar-nav ml-auto">
            {user ? (
              <>
                <li className="nav-item">
                  <Link to="/customer_service" className="nav-link">
                    Moderation Results
                  </Link>
                </li>
                <li className="nav-item">
                  <button onClick={handleLogout} className="nav-link btn-link">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link to="/login" className="nav-link">
                  Login
                </Link>
              </li>
            )}
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<ImageUploader />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} /> {/* Add this line for Register */}
          {user ? (
            <Route path="/customer_service" element={<DynamoDBData />} />
          ) : (
            <Route path="/customer_service" element={<Navigate to="/login" />} />
          )}
        </Routes>

      </div>
    </Router>
    </ModerateCountProvider>

  );
}

export default App;
