// src/components/pages/SendDocumento.jsx

import React, { useState, useLayoutEffect, useCallback } from "react";
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

export default function SendDocumento() {
  const [userAccount, setUserAccount] = useState(null); // Dirección de Smart Account
  const [userEOA, setUserEOA] = useState(null); // Dirección EOA
  const [loading, setLoading] = useState(false);
  const [smartAccount, setSmartAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);
  const [documentHash, setDocumentHash] = useState(null); // Nuevo estado para docHash
  const [dataJson, setDataJson] = useState(null);
  const [status, setStatus] = useState('notSigned');
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [isTransactionPending, setIsTransactionPending] = useState(false); // Estado para gestionar transacciones pendientes
  const [owner, setOwner] = useState(null); // Estado para almacenar el owner
  const [id, setId] = useState(null); // Nuevo estado para el ID

  // Definir los parámetros de la red
  const targetNetwork = {
    chainId: networkConfig.chainIdHex, // Usar el campo correcto
    chainName: networkConfig.name,
    nativeCurrency: {
      name: networkConfig.nativeCurrency.name,
      symbol: networkConfig.nativeCurrency.symbol,
      decimals: networkConfig.nativeCurrency.decimals,
    },
    rpcUrls: networkConfig.rpcUrls,
    blockExplorerUrls: networkConfig.blockExplorerUrls,
  };

  // Configurar el listener para recibir mensajes vía postMessage
  useLayoutEffect(() => {
    function handleMessage(event) {
      console.log('Mensaje recibido:', event);
      console.log('Origen del mensaje:', event.origin);
      console.log('Datos del mensaje:', event.data);

      // Verificar el origen del mensaje por seguridad
      /*
      if (event.origin !== 'http://localhost') {
        console.warn('Origen no autorizado:', event.origin);
        return;
      }
      */

      const { data, id } = event.data;

      if (data && id) {
        try {
          setDataJson(JSON.parse(data));
          setId(id);
          console.log('Datos recibidos vía postMessage:', event.data);
        } catch (error) {
          console.error('Error al parsear los datos recibidos:', error);
          alert('Los datos recibidos no son válidos.');
        }
      } else {
        console.warn('Datos o ID no encontrados en el mensaje recibido.');
      }
    }

    window.addEventListener('message', handleMessage);

    // Enviar mensaje de "ready" al padre
    if (window.opener) {
      window.opener.postMessage({ type: 'ready' }, '*');
    } else if (window.parent !== window) {
      window.parent.postMessage({ type: 'ready' }, '*');
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleCloseWindow = () => {
    window.close();
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

  // Función para cambiar a la red deseada
  const switchToTargetNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetNetwork.chainId }],
      });
      return true;
    } catch (switchError) {
      // Código de error 4902 significa que la cadena no está añadida
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [targetNetwork],
          });
          return true;
        } catch (addError) {
          console.error("Error al agregar la cadena:", addError);
          alert("No se pudo agregar la red deseada en MetaMask.");
          return false;
        }
      } else {
        console.error("Error al cambiar la cadena:", switchError);
        alert("No se pudo cambiar a la red deseada.");
        return false;
      }
    }
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
          const switched = await switchToTargetNetwork();
          if (!switched) {
            return; // Si no se pudo cambiar la red, salir de la función
          }
        }

        // Re-obtener el proveedor y signer después de cambiar la red
        const updatedProvider = new ethers.providers.Web3Provider(window.ethereum);
        const updatedSigner = updatedProvider.getSigner();

        // Inicializar Biconomy con el signer del usuario
        console.log("Inicializando Biconomy...");
        const sa = await initializeBiconomy(updatedSigner);
        setSmartAccount(sa);
        setSigner(updatedSigner);

        // Obtener la dirección de la Smart Account correctamente
        console.log("Obteniendo dirección de la Smart Account...");
        const address = await sa.getAccountAddress();
        setUserAccount(address);
        console.log("Smart Account conectado:", address);

        // Crear una instancia del contrato
        const contract = new ethers.Contract(contractAddress, contractABI, updatedSigner);

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
  useLayoutEffect(() => {
    if (signer && userAccount) {
      console.log("Llamando a checkWhitelist desde useLayoutEffect");
      checkWhitelist(userAccount);
    }
  }, [signer, userAccount, checkWhitelist]);

  // Monitorear cambios en isWhitelisted para logging
  useLayoutEffect(() => {
    console.log("El estado isWhitelisted cambió a:", isWhitelisted);
  }, [isWhitelisted]);

  // Monitorear cambios en status para logging
  useLayoutEffect(() => {
    console.log("El estado status ha cambiado a:", status);
  }, [status]);

  useLayoutEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isTransactionPending) {
        const message = "Se está enviando una transacción. Si cierras esta ventana ahora, se perderá.";
        event.preventDefault();
        event.returnValue = message; // Para navegadores compatibles
        return message; // Para navegadores antiguos
      }
    };
  
    window.addEventListener("beforeunload", handleBeforeUnload);
  
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isTransactionPending]);
  

  // Manejar cambios en la cuenta o en la red
  useLayoutEffect(() => {
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
          setDocumentHash(null); // Resetear docHash
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
      console.log("Estado status después de setStatus('signing'):", status);
      setDocumentHash(null); // Resetear docHash al iniciar nueva transacción
      showLoading("Firmando la transacción...");

      console.log("Enviando transacción utilizando el SDK de Biconomy...");

      // Preparar los datos de la transacción
      const tx = {
        to: contractAddress,
        data: encodeFunctionCall('saveDocument', [JSON.stringify(dataJson), userEOA, id]),
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

      // Verificar si la transacción fue exitosa
      console.log("userOpReceipt.success:", userOpReceipt.success, "Type:", typeof userOpReceipt.success);
      if (userOpReceipt.success) {
        console.log("UserOp receipt", userOpReceipt);
        console.log("Transaction receipt", userOpReceipt.receipt);
        setTransactionHash(transactionHash);
        setStatus('signed');
     

        // Parsear los logs para encontrar el evento DocumentSaved y obtener el docHash
        const iface = new ethers.utils.Interface(contractABI);
        const receipt = userOpReceipt.receipt; // Asegúrate de que este campo contenga los logs

        const logs = receipt.logs.map(log => {
          try {
            return iface.parseLog(log);
          } catch (e) {
            return null;
          }
        }).filter(log => log !== null && log.name === 'DocumentSaved');

        if (logs.length > 0) {
          const docHash = logs[0].args.docHash;
          console.log("Document Hash:", docHash);
          setDocumentHash(docHash);

          // Enviar datos al backend
          try {
            // Preparar los datos a enviar al backend
            const dataToSend = {
              transactionHash,
              documentHash: docHash,
              id,
              dataJson,
              userEOA,
              userAccount,
            };

            // Enviar los datos al backend
            const response = await axios.post('/api/sendMessage', dataToSend);

            console.log('Mensaje enviado al backend:', response.data);
          } catch (error) {
            console.error('Error al enviar datos al backend:', error);
          }
          alert("Transacción enviada exitosamente.");

        } else {
          console.warn("No se encontró el evento DocumentSaved en los logs.");
        }
      

      } else {
        throw new Error("La transacción falló.");
        console.log("userOpReceipt.success:", userOpReceipt.success, "Type:", typeof userOpReceipt.success);

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
            path="*"
            element={
              <div id="containerEnter">
                <div id="online">
                  <span>En línea</span>
                  <img src="/images/icon_checked.svg" alt="online" />
                </div>
                <div id="jsonContent">
                  {transactionHash && <p>Transacción exitosa: {transactionHash}</p>}
                  {documentHash && <p>Hash del Documento: {documentHash}</p>}
                  {dataJson ? (
                    <div>
                      {Object.entries(dataJson).map(([key, value]) => (
                        <p key={key}><strong>{key}:</strong> {value}</p>
                      ))}
                      {id && <p><strong>ID:</strong> {id}</p>}
                    </div>
                  ) : (
                    <p>Esperando datos...</p>
                  )}
                </div>
                {/* Botones de acción */}
                {userEOA && dataJson && isWhitelisted && status === 'notSigned' && (
                  <>
                    <button
                      id="actionButton"
                      onClick={sendTransactionWithSDK}
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
                    onClick={handleCloseWindow} // Añade el onClick aquí
                  >
                    Finalizar
                  </button>
                )}
                {status === 'error' && (
                  <p style={{ color: 'red' }}>Ocurrió un error. Inténtalo de nuevo.</p>
                )}

                {/* Aviso para no cerrar la ventana durante la transacción */}
                {status === 'signing' && (
                  <p style={{ color: 'red', textAlign: 'center' }}>
                    Por favor, no cierre la ventana mientras se procesa la transacción.
                  </p>
                )}
              </div>
            }
          />
        </Routes>

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
