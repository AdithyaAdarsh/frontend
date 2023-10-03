import React, { createContext, useContext, useState } from 'react';

const ModerateCountContext = createContext();

export const useModerateCount = () => {
  return useContext(ModerateCountContext);
};

export const ModerateCountProvider = ({ children }) => {
    const [moderateCount, setModerateCount] = useState(0);
    const [username, setUsername] = useState(''); // Add the username state
  
    const contextValue = {
      moderateCount,
      setModerateCount,
      username,
      setUsername,
    };
  
    return (
      <ModerateCountContext.Provider value={contextValue}>
        {children}
      </ModerateCountContext.Provider>
    );
  };
  
