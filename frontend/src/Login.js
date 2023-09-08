import React, { useState } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import axios from 'axios';

const Login = () => {
  const { oktaAuth } = useOktaAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);

    try {
      // Redirect the user to the Okta sign-in page
      await oktaAuth.signInWithRedirect();

    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? 'Logging In...' : 'Log In with Okta'}
      </button>
    </div>
  );
};

export default Login;
