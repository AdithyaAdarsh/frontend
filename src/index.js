import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Security } from '@okta/okta-react';
import oktaConfig from './oktaConfig';
import { BrowserRouter } from 'react-router-dom';


// Define the restoreOriginalUri callback function
const restoreOriginalUri = async (_oktaAuth, originalUri) => {
  // Redirect the user back to the original URL after login
  window.location.href = originalUri;
};

// Use createRoot instead of ReactDOM.render
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>
    <Security oktaAuth={oktaConfig} restoreOriginalUri={restoreOriginalUri}>
      <App />
    </Security>
  </BrowserRouter>
);

reportWebVitals();
