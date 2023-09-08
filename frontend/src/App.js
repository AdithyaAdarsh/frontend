// App.js
import React, { useState } from 'react';
import './styles.css';
import ImageUploader from './ImageUploader';
import DynamoDBData from './DynamoDBData';
import Register from './Register';
import Login from './Login';
import LoginCallback from './LoginCallback';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { ModerateCountProvider } from './ModerateCountContext';
import { Security, SecureRoute } from '@okta/okta-react';
import oktaConfig from './oktaConfig';
import { toRelativeUrl } from '@okta/okta-auth-js';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (username) => {
    setUser(username);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const restoreOriginalUri = async (_oktaAuth, originalUri) => {
    // Redirect the user back to the original URL after login
    window.location.href = toRelativeUrl(originalUri, window.location.origin);
  };

  return (
    <ModerateCountProvider>
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
        <Security oktaAuth={oktaConfig} restoreOriginalUri={restoreOriginalUri}>
          <Routes>
            <Route path="/" element={<ImageUploader />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} /> {/* Add this route */}
            <Route path="/login/callback" element={<LoginCallback />} />
            {user ? (
              <SecureRoute path="/customer_service" element={<DynamoDBData />} />
            ) : (
              <Route path="/customer_service" element={<DynamoDBData />} />
            )}
          </Routes>
        </Security>


      </div>
    </ModerateCountProvider>
  );
}

export default App;
