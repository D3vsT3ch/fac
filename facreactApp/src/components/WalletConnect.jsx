// src/components/WalletConnect.jsx
import React from "react";
import PropTypes from 'prop-types';

export default function WalletConnect({ onConnect }) {
  console.log("WalletConnect component rendered");
  return (
    <button id="connectButton" onClick={onConnect}>
      Conectar Wallet
    </button>
  );
}

WalletConnect.propTypes = {
  onConnect: PropTypes.func.isRequired,
};
