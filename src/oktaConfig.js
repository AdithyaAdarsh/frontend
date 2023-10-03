import { OktaAuth } from '@okta/okta-auth-js';

const oktaConfig = {
  issuer: 'https://dev-32617710.okta.com/oauth2/default',
  clientId: '0oab13mt0oKO5ozPi5d7',
  redirectUri: window.location.origin + '/login/callback',
  pkce: 'true'
};

const oktaAuth = new OktaAuth(oktaConfig);

// Define the restoreOriginalUri callback
oktaAuth.tokenManager.on('tokenRenew', (key, token) => {
  // Store the original URL in sessionStorage
  sessionStorage.setItem('oktaOriginalUri', window.location.href);
});

export default oktaAuth;
