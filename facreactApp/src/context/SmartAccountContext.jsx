// src/context/SmartAccountContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const SmartAccountContext = createContext();

export const SmartAccountProvider = ({ children }) => {
  const [smartAccount, setSmartAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [userAccount, setUserAccount] = useState(null);

  // Aquí puedes agregar lógica para inicializar y gestionar la Smart Account

  return (
    <SmartAccountContext.Provider
      value={{
        smartAccount,
        setSmartAccount,
        signer,
        setSigner,
        userAccount,
        setUserAccount,
      }}
    >
      {children}
    </SmartAccountContext.Provider>
  );
};
