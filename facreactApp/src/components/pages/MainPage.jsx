// src/components/pages/MainPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import { ethers } from "ethers";
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



  const [isWhitelisted, setIsWhitelisted] = useState(false);

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
        //console.log("Intentando obtener el owner del contrato...");
        //const ownerAddress = await contract.owner();
        //const lowerOwnerAddress = ownerAddress.toLowerCase();
      
        //console.log("Owner Address obtenido:", lowerOwnerAddress);

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



  return (
    <div id="signBody">


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
                  {userEOA && (
                    <div>
                      <p style={{ fontWeight: 900 }}>EOA:</p>

                      <p> {userEOA}</p>
                    </div>
                  )}
                  {userAccount && (
                    <div>
                       <p style={{ fontWeight: 900 }}>Smart Account: </p>
                      <p> {userAccount}</p>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                {console.log("Valores para renderizado del mensaje:")}
                {console.log("userEOA:", userEOA)}

                {console.log("isWhitelisted:", isWhitelisted)}

                {!userEOA && <WalletConnect onConnect={connectWallet} />}

                {userEOA && !isWhitelisted && (
                  <p style={{ color: 'red' }}>Tu cuenta no está en la lista blanca.</p>
                )}

                {status === 'error' && (
                  <p style={{ color: 'red' }}>Ocurrió un error. Inténtalo de nuevo.</p>
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


