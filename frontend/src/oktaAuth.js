import { OktaAuth } from '@okta/okta-auth-js';

const oktaConfig = {
    issuer: 'https://dev-32617710.okta.com/oauth2/default',
  clientId: '0oab13mt0oKO5ozPi5d7',
  redirectUri: window.location.origin + '/customer_service',
  pkce: 'true'
};

const oktaAuth = new OktaAuth(oktaConfig);

// Define the restoreOriginalUri callback
oktaAuth.tokenManager.on('tokenRenew', (key, token) => {
  // Store the original URL in sessionStorage
  sessionStorage.setItem('oktaOriginalUri', window.location.href);
});

// Define the restoreOriginalUri callback function
const restoreOriginalUri = async (oktaAuth, originalUri) => {
  window.location.assign(originalUri);
};

export default {
  oktaAuth,
  restoreOriginalUri,
};
