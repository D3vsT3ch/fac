// src/App.jsx
import React, { useState, useEffect } from "react";
import UserInfo from "./components/UserInfo"; // Asegúrate de la ruta correcta
import WalletConnect from "./components/WalletConnect";
import Loader from "./components/Loader";
import {
  contractABI,
  contractAddress,
  requiredChainId,
  rpcUrls,
  chainName,
  blockExplorerUrls,
  nameCoint,
  coint,
} from "./contrato";
import { initializeBiconomy } from "./biconomy";

export default function App() {
  const [userAccount, setUserAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nexusClient, setNexusClient] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);
  const [dataJson, setDataJson] = useState(null);
  const [status, setStatus] = useState('notSigned'); // Estados: notSigned, signing, signed, saving, saved, error

  // Parsear parámetros de la URL al montar el componente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('data');
    if (dataParam) {
      console.log('Raw dataParam:', dataParam);
      try {
        const decodedData = decodeURIComponent(dataParam);
        console.log('Decoded dataParam:', decodedData);
        const parsedData = JSON.parse(decodedData);
        console.log('Parsed dataJson:', parsedData);
        setDataJson(parsedData);
      } catch (error) {
        console.error('Error al parsear el parámetro "data":', error);
        alert('El parámetro "data" en la URL no es válido.');
      }
    } else {
      console.log('No se proporcionó el parámetro "data" en la URL.');
    }
  }, []);

  // Inicializar Biconomy al montar el componente
  useEffect(() => {
    const initBiconomy = async () => {
      try {
        const client = await initializeBiconomy();
        setNexusClient(client);
      } catch (error) {
        console.error("Error al inicializar Biconomy:", error);
      }
    };

    initBiconomy();
  }, []);

  // Manejar eventos de cambio de cuenta y red
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [requiredChainId]);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      console.log("Por favor, conecta una cuenta.");
      setUserAccount(null);
      setStatus('notSigned');
    } else {
      setUserAccount(accounts[0]);
      setStatus('notSigned');
    }
  };

  const handleChainChanged = async (_chainId) => {
    console.log("Chain cambiado a:", _chainId);
    await verifyNetwork();
  };

  // Verificar la red correcta
  const verifyNetwork = async () => {
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      const numericChainId = parseInt(chainId, 16);
      console.log("Current chain ID:", numericChainId);

      if (numericChainId !== requiredChainId) {
        alert('Por favor, cambia a la red de prueba Polygon Amoy en MetaMask.');
        setStatus('error');
        await switchToNetwork();
      } else {
        console.log("Conectado a la red correcta.");
        setStatus('notSigned');
      }
    } catch (error) {
      console.error("Error al verificar la red:", error);
      setStatus('error');
    }
  };

  // Mostrar/ocultar animación de carga
  const showLoading = (message) => {
    setLoading(true);
  };

  const hideLoading = () => {
    setLoading(false);
  };

  // Cambiar de red a Polygon Amoy
  const switchToNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${requiredChainId.toString(16)}` }],
      });
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${requiredChainId.toString(16)}`,
                chainName,
                rpcUrls: [rpcUrls],
                nativeCurrency: {
                  name: nameCoint,
                  symbol: coint,
                  decimals: 18,
                },
                blockExplorerUrls: [blockExplorerUrls],
              },
            ],
          });
        } catch (addError) {
          console.error("Error al agregar la red:", addError);
          setStatus('error');
        }
      } else {
        console.error("Error al cambiar/agregar la red:", error);
        setStatus('error');
      }
    }
  };

  // Conectar MetaMask y Biconomy
  const connectMetamask = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const account = accounts[0];
        setUserAccount(account);
        setStatus('verifying');

        // Verificar la red
        const chainId = parseInt(
          await window.ethereum.request({ method: "eth_chainId" }),
          16
        );
        if (chainId !== requiredChainId) {
          await switchToNetwork();
        } else {
          setStatus('notSigned');
        }

      } catch (error) {
        console.error("Error al conectar MetaMask:", error);
        alert("No se pudo conectar a MetaMask.");
        setStatus('error');
      }
    } else {
      alert("MetaMask no está instalado.");
    }
  };

  // Enviar transacción patrocinada
  const sendSponsoredTransaction = async () => {
    if (!nexusClient || !dataJson || !userAccount) {
      alert("Nexus Client, datos JSON o cuenta de usuario no está inicializado.");
      return;
    }

    try {
      setStatus('signing');
      showLoading("Firmando la transacción...");

      // Preparar los datos de la transacción
      const tx = await nexusClient.sendTransaction({
        calls: [
          {
            to: contractAddress,
            data: nexusClient.account.interface.encodeFunctionData("saveDocument", [JSON.stringify(dataJson)]),
            value: 0n,
          },
        ],
      });

      console.log("Transacción exitosa:", tx);
      setTransactionHash(tx);
      setStatus('signed');
      hideLoading();

    } catch (error) {
      console.error("Error al enviar transacción:", error);
      alert("Error: " + error.message);
      setStatus('error');
      hideLoading();
    }
  };

  return (
    <div id="signBody">
      <UserInfo userAccount={userAccount} /> {/* Mover fuera de la container si es necesario */}
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
          <WalletConnect onConnect={connectMetamask} />
          {userAccount && dataJson && status === 'notSigned' && (
            <button
              id="actionButton"
              onClick={sendSponsoredTransaction}
            >
              Firmar
            </button>
          )}
          {userAccount && dataJson && status === 'signed' && (
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
