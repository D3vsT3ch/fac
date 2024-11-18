// src/components/WalletConnect.jsx
import React from "react";

export default function WalletConnect({ onConnect }) {
  return (
    <div>
      <button id="connectButton" onClick={onConnect}>
        Conectar
      </button>
    </div>
  );
}
