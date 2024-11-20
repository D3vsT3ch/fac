// src/App.jsx
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import UserInfo from "./components/UserInfo";
import WalletConnect from "./components/WalletConnect";
import Loader from "./components/Loader";
import { contractABI, contractAddress } from "./contrato";
import "./styles/App.css";
import { requiredChainId, networkConfig } from "./config";
import { initializeBiconomy } from "./biconomy";

export default function App() {
  const [userAccount, setUserAccount] = useState(null); // Dirección de Smart Account
  const [userEOA, setUserEOA] = useState(null); // Dirección EOA
  const [loading, setLoading] = useState(false);
  const [smartAccount, setSmartAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);
  const [dataJson, setDataJson] = useState(null);
  const [status, setStatus] = useState('notSigned');
  const [isWhitelisted, setIsWhitelisted] = useState(false);

  // Parsear parámetros de la URL al montar el componente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('data');
    if (dataParam) {
      console.log('Raw dataParam:', dataParam);
      try {
        // Asegúrate de que el JSON está correctamente codificado en la URL
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

  // Función para conectar la wallet del usuario e inicializar Biconomy
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Solicitar acceso a la cuenta del usuario
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const userSigner = provider.getSigner();

        // Obtener la dirección EOA del usuario
        const eoaAddress = await userSigner.getAddress();
        setUserEOA(eoaAddress);
        console.log("Dirección EOA del usuario:", eoaAddress);

        // Verificar que el usuario esté en la red correcta
        const { chainId } = await provider.getNetwork();
        console.log("Chain ID del proveedor:", chainId);
        if (chainId !== requiredChainId) {
          alert(`Por favor, conéctate a la red ${networkConfig.name}.`);
          return;
        }

        // Inicializar Biconomy con el signer del usuario
        const sa = await initializeBiconomy(userSigner);

        setSmartAccount(sa);
        setSigner(userSigner);

        const address = await sa.getAccountAddress();
        setUserAccount(address);

        console.log("Smart Account conectado:", address);

        // No llamar a checkWhitelist aquí; lo haremos en useEffect
      } catch (error) {
        console.error("Error al conectar la wallet:", error);
      }
    } else {
      alert("Por favor, instala MetaMask.");
    }
  };

  // Función para enviar la transacción directamente
  const sendTransactionDirectly = async () => {
    if (!smartAccount || !dataJson) {
      alert("La Smart Account o los datos JSON no están inicializados.");
      return;
    }

    if (!isWhitelisted) {
      alert("Tu cuenta no está en la lista blanca.");
      return;
    }

    try {
      console.log("Enviando transacción directamente desde Smart Account...");
      setStatus('signing');
      showLoading("Firmando la transacción...");

      // Codificar la llamada a la función del contrato
      const iface = new ethers.utils.Interface(contractABI);
      const data = iface.encodeFunctionData('saveDocument', [JSON.stringify(dataJson)]);
      console.log("Datos codificados de la transacción:", data);

      // Crear la transacción
      const tx = {
        to: contractAddress,
        data: data,
      };

      // Enviar la transacción
      const userOpResponse = await smartAccount.sendTransaction(tx);
      const { transactionHash } = await userOpResponse.waitForTxHash();
      console.log("Transaction Hash", transactionHash);
      setTransactionHash(transactionHash);

      const userOpReceipt = await userOpResponse.wait();
      if (userOpReceipt.success === "true") {
        console.log("UserOp receipt", userOpReceipt);
        console.log("Transaction receipt", userOpReceipt.receipt);
        setStatus('signed');
      } else {
        throw new Error("La transacción no fue exitosa.");
      }

      hideLoading();
    } catch (error) {
      console.error("Error al enviar transacción:", error);
      let errorMessage = "Ocurrió un error al enviar la transacción.";
      if (error.data && error.data.message) {
        errorMessage = error.data.message;
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert("Error: " + errorMessage);
      setStatus('error');
      hideLoading();
    }
  };

  // Función para verificar si la cuenta está en la whitelist
  const checkWhitelist = async (account) => {
    console.log("checkWhitelist llamada con account:", account);
    if (!signer) {
      console.log("Signer no está definido en checkWhitelist");
      return;
    }

    try {
      console.log("Verificando si la cuenta está en la whitelist:", account);
      console.log("Usando contrato en la dirección:", contractAddress);
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const whitelisted = await contract.isWhitelisted(account);
      setIsWhitelisted(whitelisted);
      console.log("Estado isWhitelisted actualizado a:", whitelisted);
    } catch (error) {
      console.error("Error al verificar la whitelist:", error);
    }
  };

  // Monitorear cambios en isWhitelisted
  useEffect(() => {
    if (signer && userAccount) {
      console.log("Llamando a checkWhitelist desde useEffect");
      checkWhitelist(userAccount);
    }
  }, [signer, userAccount]);

  // Monitorear cambios en isWhitelisted para logging
  useEffect(() => {
    console.log("El estado isWhitelisted cambió a:", isWhitelisted);
  }, [isWhitelisted]);

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

  return (
    <div id="signBody">
      <UserInfo userEOA={userEOA} userAccount={userAccount} className={userEOA ? 'visible' : ''} />
    
      <div className="container">
        <img src="/images/logo.svg" alt="logo" />      
        <div className="subTitle">Firma Electrónica</div>

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
                onClick={sendTransactionDirectly}
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

        {loading && <Loader message="Procesando..." />}
      </div>
    </div>
  );
}
