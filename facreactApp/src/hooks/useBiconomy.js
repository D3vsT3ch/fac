// src/hooks/useBiconomy.js
import { useState, useEffect, useCallback } from "react";
import { ethers, utils } from "ethers";
import { initializeBiconomy } from "../biconomy";
import { contractABI, contractAddress } from "../contrato";
import { requiredChainId, networkConfig } from "../config";

export const useBiconomy = () => {
  const [userAccount, setUserAccount] = useState(null);
  const [userEOA, setUserEOA] = useState(null);
  const [loading, setLoading] = useState(false);
  const [smartAccount, setSmartAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isTransactionPending, setIsTransactionPending] = useState(false);

  // Función para mostrar el loader
  const showLoading = (message) => {
    console.log("Mostrando loader:", message);
    setLoading(true);
  };

  // Función para ocultar el loader
  const hideLoading = () => {
    console.log("Ocultando loader");
    setLoading(false);
  };

  // Función para conectar la wallet
  const connectWallet = useCallback(async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const userSigner = provider.getSigner();

        const eoaAddress = await userSigner.getAddress();
        const lowerEoaAddress = eoaAddress.toLowerCase();
        setUserEOA(lowerEoaAddress);
        console.log("Dirección EOA del usuario:", lowerEoaAddress);

        const { chainId } = await provider.getNetwork();
        console.log("Chain ID del proveedor:", chainId);
        if (chainId !== requiredChainId) {
          alert(`Por favor, conéctate a la red ${networkConfig.name}.`);
          return;
        }

        console.log("Inicializando Biconomy...");
        const sa = await initializeBiconomy(userSigner);
        setSmartAccount(sa);
        setSigner(userSigner);

        console.log("Obteniendo dirección de la Smart Account...");
        const address = await sa.getAccountAddress();
        setUserAccount(address);
        console.log("Smart Account conectado:", address);
      } catch (error) {
        console.error("Error al conectar la wallet:", error);
        alert(`Error al conectar la wallet: ${error.message}`);
      }
    } else {
      alert("Por favor, instala MetaMask.");
    }
  }, []);

  // Función para enviar transacciones utilizando Biconomy
  const sendTransactionWithBiconomy = useCallback(async (to, data) => {
    if (!smartAccount) {
      throw new Error("La Smart Account no está inicializada.");
    }

    const tx = {
      to,
      data,
      // Puedes agregar más campos como `value` si es necesario
    };

    const userOpResponse = await smartAccount.sendTransaction(tx);
    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("Transaction Hash:", transactionHash);

    // Esperar a que la transacción sea confirmada
    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success !== true && userOpReceipt.success !== "true") {
      throw new Error("La transacción no fue exitosa.");
    }

    console.log("UserOp receipt:", userOpReceipt);
    console.log("Transaction receipt:", userOpReceipt.receipt);
    return userOpReceipt.receipt;
  }, [smartAccount]);

  // Manejar cambios en la cuenta o en la red
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setUserEOA(accounts[0].toLowerCase());
          console.log("Cuenta cambiada a:", accounts[0]);
          connectWallet();
        } else {
          setUserEOA(null);
          setUserAccount(null);
          console.log("Wallet desconectada");
        }
      };

      const handleChainChanged = (chainId) => {
        console.log("Chain cambiada a:", chainId);
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Cleanup on unmount
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [connectWallet]);

  return {
    userAccount,
    userEOA,
    loading,
    connectWallet,
    sendTransactionWithBiconomy,
    showLoading,
    hideLoading,
    setIsTransactionPending,
    isTransactionPending,
    signer,
    smartAccount,
  };
};
