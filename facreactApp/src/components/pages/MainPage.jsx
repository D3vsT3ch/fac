// src/components/pages/MainPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import { ethers } from "ethers";
import UserInfo from "../UserInfo";
import WalletConnect from "../WalletConnect";
import Loader from "../Loader";
import { contractABI, contractAddress } from "../../contrato";
import "../../styles/App.css";
import { requiredChainId, networkConfig } from "../../config";
import { initializeBiconomy } from "../../biconomy";
import axios from "axios";
import { PaymasterMode } from "@biconomy/account"; // Importar PaymasterMode si se usa

export default function MainPage() {
  const [userAccount, setUserAccount] = useState(null); // Dirección de Smart Account
  const [userEOA, setUserEOA] = useState(null); // Dirección EOA
  const [loading, setLoading] = useState(false);
  const [smartAccount, setSmartAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);
  const [dataJson, setDataJson] = useState(null);
  const [status, setStatus] = useState('notSigned');
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [isTransactionPending, setIsTransactionPending] = useState(false); // Estado para gestionar transacciones pendientes
  const [owner, setOwner] = useState(null); // Estado para almacenar el owner

  // Parsear parámetros de la URL al montar el componente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('data');
    if (dataParam) {
      console.log('Raw dataParam:', dataParam);
      try {
        const decodedData = JSON.parse(decodeURIComponent(dataParam));
        console.log('Decoded dataParam:', decodedData);
        setDataJson(decodedData);
      } catch (error) {
        console.error('Error al parsear el parámetro "data":', error);
        alert('El parámetro "data" en la URL no es válido.');
      }
    } else {
      console.log('No se proporcionó el parámetro "data" en la URL.');
    }
  }, []);

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
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Solicitar acceso a la cuenta del usuario
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const userSigner = provider.getSigner();

        // Obtener la dirección EOA del usuario
        const eoaAddress = await userSigner.getAddress();
        const lowerEoaAddress = eoaAddress.toLowerCase();
        setUserEOA(lowerEoaAddress);
        console.log("Dirección EOA del usuario:", lowerEoaAddress);

        // Verificar que el usuario esté en la red correcta
        const { chainId } = await provider.getNetwork();
        console.log("Chain ID del proveedor:", chainId);
        if (chainId !== requiredChainId) {
          alert(`Por favor, conéctate a la red ${networkConfig.name}.`);
          return;
        }

        // Inicializar Biconomy con el signer del usuario
        console.log("Inicializando Biconomy...");
        const sa = await initializeBiconomy(userSigner);
        setSmartAccount(sa);
        setSigner(userSigner);

        // Obtener la dirección de la Smart Account correctamente
        console.log("Obteniendo dirección de la Smart Account...");
        const address = await sa.getAccountAddress();
        setUserAccount(address);
        console.log("Smart Account conectado:", address);

        // Crear una instancia del contrato
        const contract = new ethers.Contract(contractAddress, contractABI, userSigner);

        // Obtener el owner del contrato
        console.log("Intentando obtener el owner del contrato...");
        const ownerAddress = await contract.owner();
        const lowerOwnerAddress = ownerAddress.toLowerCase();
        setOwner(lowerOwnerAddress);
        console.log("Owner Address obtenido:", lowerOwnerAddress);

        // Verificar la whitelist
        await checkWhitelist(address);

      } catch (error) {
        console.error("Error al conectar la wallet:", error);
        alert(`Error al conectar la wallet: ${error.message}`);
      }
    } else {
      alert("Por favor, instala MetaMask.");
    }
  };

  // Función para verificar si la cuenta está en la whitelist
  const checkWhitelist = useCallback(async (account) => {
    console.log("checkWhitelist llamada con account:", account);
    if (!signer) {
      console.log("Signer no está definido en checkWhitelist");
      return;
    }

    try {
      console.log("Verificando si la cuenta está en la whitelist:", account);
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const whitelisted = await contract.isWhitelisted(account);
      setIsWhitelisted(whitelisted);
      console.log("Estado isWhitelisted actualizado a:", whitelisted);
    } catch (error) {
      console.error("Error al verificar la whitelist:", error);
    }
  }, [signer]);

  // Monitorear cambios en signer y userAccount para verificar whitelist
  useEffect(() => {
    if (signer && userAccount) {
      console.log("Llamando a checkWhitelist desde useEffect");
      checkWhitelist(userAccount);
    }
  }, [signer, userAccount, checkWhitelist]);

  // Monitorear cambios en isWhitelisted para logging
  useEffect(() => {
    console.log("El estado isWhitelisted cambió a:", isWhitelisted);
  }, [isWhitelisted]);

  // Manejar cambios en la cuenta o en la red
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setUserEOA(accounts[0].toLowerCase());
          console.log("Cuenta cambiada a:", accounts[0]);
          // Reconectar para actualizar estados y datos
          connectWallet();
        } else {
          setUserEOA(null);
          setUserAccount(null);
          setIsWhitelisted(false);
          console.log("Wallet desconectada");
        }
      };

      const handleChainChanged = (chainId) => {
        console.log("Chain cambiada a:", chainId);
        // Puedes recargar la página o manejar el cambio de red aquí
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

  // Función para enviar transacciones utilizando el SDK de Biconomy
  const sendTransactionWithSDK = async () => {
    if (!smartAccount || !dataJson) {
      alert("La Smart Account o los datos JSON no están inicializados.");
      return;
    }

    if (!isWhitelisted) {
      alert("Tu cuenta no está en la lista blanca.");
      return;
    }

    if (isTransactionPending) {
      alert("Por favor, espera a que la transacción anterior se confirme.");
      return;
    }

    try {
      setIsTransactionPending(true);
      setStatus('signing');
      showLoading("Firmando la transacción...");

      console.log("Enviando transacción utilizando el SDK de Biconomy...");

      // Preparar los datos de la transacción
      const tx = {
        to: contractAddress,
        data: encodeFunctionCall('saveDocument', [JSON.stringify(dataJson), userAccount]),
      };

      // Enviar la transacción usando el SDK
      const userOpResponse = await smartAccount.sendTransaction(tx, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
      });

      // Obtener el hash de la transacción
      const { transactionHash } = await userOpResponse.waitForTxHash();
      console.log("Transaction Hash", transactionHash);

      // Esperar a que la transacción se confirme
      const userOpReceipt = await userOpResponse.wait();
      if (userOpReceipt.success === "true") {
        console.log("UserOp receipt", userOpReceipt);
        console.log("Transaction receipt", userOpReceipt.receipt);
        setTransactionHash(transactionHash);
        setStatus('signed');
        alert("Transacción enviada exitosamente.");
      } else {
        throw new Error("La transacción falló.");
      }

    } catch (error) {
      console.error("Error al enviar la transacción con el SDK:", error);
      let errorMessage = "Ocurrió un error al enviar la transacción.";
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error.message;
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert("Error: " + errorMessage);
      setStatus('error');
    } finally {
      setIsTransactionPending(false);
      hideLoading();
    }
  };

  return (
    <div id="signBody">
      <UserInfo userEOA={userEOA} userAccount={userAccount} className={userEOA ? 'visible' : ''} />

      <div className="container">
        <img src="/images/logo.svg" alt="logo" />
        <div className="subTitle">Firma Electrónica</div>

        <Routes>
          <Route
            path="*" // Utilizar "*" para capturar todas las rutas
            element={
              <div id="containerEnter">
                <div id="online">
                  <span>En línea</span>
                  <img src="/images/icon_checked.svg" alt="online" />
                </div>
                <div id="jsonContent">
                  {transactionHash && <p>Transacción exitosa: {transactionHash}</p>}
                  {!dataJson && <p>No se proporcionó JSON en la URL.</p>}
                  {dataJson && (
                    <div>
                      {Object.entries(dataJson).map(([key, value]) => (
                        <p key={key}><strong>{key}:</strong> {value}</p>
                      ))}
                    </div>
                  )}
                </div>
                {/* Botones de acción */}
                {console.log("Valores para renderizado del mensaje:")}
                {console.log("userEOA:", userEOA)}
                {console.log("dataJson:", dataJson)}
                {console.log("isWhitelisted:", isWhitelisted)}
                {userEOA && dataJson && isWhitelisted && status === 'notSigned' && (
                  <>
                    <button
                      id="actionButton"
                      onClick={sendTransactionWithSDK} // Usar el método del SDK
                      disabled={isTransactionPending}
                    >
                      Firmar
                    </button>
                  </>
                )}
                {!userEOA && <WalletConnect onConnect={connectWallet} />}
                {userEOA && dataJson && !isWhitelisted && (
                  <p style={{ color: 'red' }}>Tu cuenta no está en la lista blanca.</p>
                )}
                {userEOA && dataJson && status === 'signed' && (
                  <button
                    id="actionButton"
                    disabled
                  >
                    Transacción Enviada
                  </button>
                )}
                {status === 'error' && (
                  <p style={{ color: 'red' }}>Ocurrió un error. Inténtalo de nuevo.</p>
                )}
              </div>
            }
          />
        </Routes>

        {/* Botón de Conectar */}
        {!userEOA && (
          <div className="center-text" style={{ marginTop: "20px" }}>
            <WalletConnect onConnect={connectWallet} />
          </div>
        )}

        {loading && <Loader message="Procesando..." />}
      </div>
    </div>
  );
}

// Función para codificar la llamada a la función del contrato
const encodeFunctionCall = (functionName, params) => {
  const iface = new ethers.utils.Interface(contractABI);
  return iface.encodeFunctionData(functionName, params);
};
