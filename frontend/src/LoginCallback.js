import React, { useEffect } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


const LoginCallback = () => {
  const { oktaAuth } = useOktaAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleTokenExchange = async () => {
      try {
        // Handle the Okta redirect after successful login
        await oktaAuth.handleRedirect("/login/callback");

        // Retrieve the Okta token storage data
        const oktaTokenStorage = JSON.parse(localStorage.getItem('okta-token-storage'));

        if (oktaTokenStorage && oktaTokenStorage.accessToken && oktaTokenStorage.accessToken.accessToken) {
          const accessToken = oktaTokenStorage.accessToken.accessToken;
          const sub = oktaTokenStorage.accessToken.claims.sub; // Access the 'sub' claim

          // Now, you have the access token and the 'sub' claim, and you can proceed to send them to the server
          axios
            .post('http://localhost:5000/login', { access_token: accessToken, sub: sub })
            .then((response) => {
              if (response.data.access_token) {
                // Store the new access token securely (localStorage or sessionStorage)
                localStorage.setItem('token', response.data.access_token);
      
                // Redirect to the /customer_service route or perform other actions
                navigate('/customer_service');
              } else {
                console.error('Access token not received');
                // Handle this error case, e.g., display a message to the user
              }
            })
            .catch((error) => {
              console.error('Error sending token to server:', error);
              // Handle this error case, e.g., display a message to the user
            });
        } else {
          console.error('Access token not found in Okta token storage');
          // Handle this error case, e.g., display a message to the user
        }
      } catch (error) {
        console.error('Token exchange error:', error);
        // Handle this error case, e.g., display a message to the user
      }
    };

    handleTokenExchange();
  }, [oktaAuth]);

  return <div>Logging in...</div>;
};

export default LoginCallback;
