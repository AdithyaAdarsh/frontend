import React, { useState, useEffect } from 'react';
import './styles.css';
import ImageUploader from './ImageUploader';
import DynamoDBData, { resetFetchedImageUUIDs } from './DynamoDBData';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { ModerateCountProvider } from './ModerateCountContext';
import { Security, SecureRoute, useOktaAuth } from '@okta/okta-react';
import oktaConfig from './oktaConfig';
import { toRelativeUrl } from '@okta/okta-auth-js';
import LoginCallback from './LoginCallback';
import 'bootstrap/dist/css/bootstrap.min.css';


function App() {
  const { oktaAuth, authState } = useOktaAuth();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('authState:', authState);
  
    // Check if the user is authenticated and set the user state accordingly
    if (authState && authState.isAuthenticated) {
      console.log('User is authenticated');
      setUser(authState.userInfo?.given_name); // Set the user's name or identifier
    } else {
      console.log('User is not authenticated');
      setUser(null); // User is not authenticated
    }
  }, [authState]);
  

  const handleLogin = () => {
    // Redirect the user to the Okta login page
    oktaAuth.signInWithRedirect();
  };

  const handleLogout = async () => {
    try {
      // Sign out the user and clear the session
      await oktaAuth.signOut();
      resetFetchedImageUUIDs();

    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  

  const restoreOriginalUri = async (_oktaAuth, originalUri) => {
    window.location.href = toRelativeUrl(originalUri, window.location.origin);
  };

  return (
    <ModerateCountProvider>
      <div className="App">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <Link to="/" className="navbar-brand ml-auto">
            Home
          </Link>
          <ul className="navbar-nav ml-auto">
          {authState && authState.isAuthenticated ? (
            <>
              <li className="nav-item">
                <Link to="/customer_service" className="btn btn-outline-primary ml-2">
                  Moderation Results
                </Link>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="btn btn-outline-danger">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li className="nav-item">
              <button onClick={handleLogin} className="btn btn-outline-success ">
                Login
              </button>
            </li>
          )}

          </ul>
        </nav>
        <Security oktaAuth={oktaConfig} restoreOriginalUri={restoreOriginalUri}>
          <Routes>
            <Route path="/" element={<ImageUploader />} />
            <Route path="/login/callback" element={<LoginCallback />} />
            {user ? (
              <SecureRoute path="/customer_service" element={<DynamoDBData />} />
            ) : (
              // Redirect to Okta login if the user is not authenticated
              <Route
                path="/customer_service"
                element={
                  authState && authState.isAuthenticated ? (
                    <DynamoDBData />
                  ) : (
                    <navigate to="/login/callback" />
                  )
                }
              />
            )}
          </Routes>
        </Security>
      </div>
    </ModerateCountProvider>
  );
}

export default App;
