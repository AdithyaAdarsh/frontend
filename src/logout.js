import React from 'react';
import { useOktaAuth } from '@okta/okta-react';

const Logout = () => {
  const { oktaAuth } = useOktaAuth();

  const handleLogout = async () => {
    oktaAuth.signOut();
  };

  return (
    <button onClick={handleLogout} className="nav-link btn-link">
      Logout
    </button>
  );
};

export default Logout;
