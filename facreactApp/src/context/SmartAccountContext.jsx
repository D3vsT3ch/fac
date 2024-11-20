// src/context/SmartAccountContext.jsx
import React, { createContext, useState } from "react";

export const SmartAccountContext = createContext();

export const SmartAccountProvider = ({ children }) => {
  const [smartAccount, setSmartAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [userAccount, setUserAccount] = useState(null);

  return (
    <SmartAccountContext.Provider value={{ smartAccount, setSmartAccount, signer, setSigner, userAccount, setUserAccount }}>
      {children}
    </SmartAccountContext.Provider>
  );
};
