import React, { useEffect } from 'react';
import { Security } from '@okta/okta-react';
import { OktaAuth } from '@okta/okta-auth-js';
import App from './App';

const oktaConfig = {
  issuer: 'https://dev-32617710.okta.com.com/oauth2/default', // Replace with your Okta issuer URL
  clientId: '0oab13mt0oKO5ozPi5d7', // Replace with your Okta client ID
  redirectUri: window.location.origin + '/implicit/callback',
};

const oktaAuth = new OktaAuth(oktaConfig);

// Define the restoreOriginalUri callback
oktaAuth.tokenManager.on('tokenRenew', (_, newToken) => {
  const originalUri = sessionStorage.getItem('oktaOriginalUri');
  if (originalUri) {
    window.location.assign(originalUri);
  }
});

const AppWithOkta = () => {
  useEffect(() => {
    // Store the original URL in sessionStorage
    sessionStorage.setItem('oktaOriginalUri', window.location.href);
  }, []);

  return (
    <Security oktaAuth={oktaAuth}>
      <App />
    </Security>
  );
};

export default AppWithOkta;
