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
  const [userAccount, setUserAccount] = useState(null); // Smart Account Address
  const [userEOA, setUserEOA] = useState(null); // EOA Address
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

        // Verificar si la Smart Account está en la lista blanca
        await checkWhitelist(address);
      } catch (error) {
        console.error("Error al conectar la wallet:", error);
      }
    } else {
      alert("Por favor, instala MetaMask.");
    }
  };

  // Función para verificar si la cuenta está en la whitelist
  const checkWhitelist = async (account) => {
    if (!signer) return;

    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      // Usa la dirección de la Smart Account para verificar la whitelist
      const whitelisted = await contract.isWhitelisted(account);
      setIsWhitelisted(whitelisted);
      console.log(`¿Está en la whitelist? ${whitelisted}`);
    } catch (error) {
      console.error("Error al verificar la whitelist:", error);
    }
  };

  // Función para enviar la transacción utilizando la Smart Account
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

      // Crear y enviar la UserOperation
      const userOp = await smartAccount.createUserOp({
        target: contractAddress,
        data: data,
      });

      const response = await smartAccount.sendUserOp(userOp);
      console.log("Respuesta de sendUserOp:", response);

      const userOpHash = response.userOpHash;
      setTransactionHash(userOpHash);
      setStatus('signed');
      hideLoading();

      // Esperar a que la transacción sea confirmada (opcional)
      const txReceipt = await response.wait();
      console.log("Transacción confirmada:", txReceipt);
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
      {!userEOA && <WalletConnect onConnect={connectWallet} />}
      <div className="container">
        <img src="/images/logo.svg" alt="logo" />
        <div className="title">Plataforma Destructrong</div>
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
