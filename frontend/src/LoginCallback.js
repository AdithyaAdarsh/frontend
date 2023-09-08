import { useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useOktaAuth } from '@okta/okta-react';

const LoginCallback = () => {
  const { oktaAuth } = useOktaAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleTokenExchange = async () => {
      try {
        // Get the Okta token from the URL parameters or from auth state
        const { tokens } = await oktaAuth.handleRedirect();

        if (tokens && tokens.idToken) {
          // Send the Okta token to your server's /login endpoint
          axios
            .post('http://localhost:5000/login', { okta_token: tokens.idToken })
            .then((response) => {
              if (response.data.access_token) {
                // Store the token securely (localStorage or sessionStorage)
                localStorage.setItem('token', response.data.access_token);

                // Redirect to the /customer_service route
                navigate('/customer_service');

                // You can now navigate to the protected route if needed
                // Example: navigate('/customer_service');
              } else {
                console.error('Access token not received');
                // Handle this error case, e.g., display a message to the user
              }
            })
            .catch((error) => {
              console.error('Error sending token to server:', error);
              // Handle this error case, e.g., display a message to the user
            });
        }
      } catch (error) {
        console.error('Token exchange error:', error);
        // Handle this error case, e.g., display a message to the user
      }
    };

    handleTokenExchange();
  }, [oktaAuth, navigate]);

  return <div>Logging in...</div>;
};

export default LoginCallback;
