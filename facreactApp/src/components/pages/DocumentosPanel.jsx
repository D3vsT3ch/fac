// src/components/pages/AdminPanel.jsx
import React, { useState, useEffect } from "react";
import { ethers, utils } from "ethers";
import UserInfo from "../UserInfo";
import WalletConnect from "../WalletConnect";
import Loader from "../Loader";

import { contractABI, contractAddress } from "../../contrato";
import "../../styles/App.css";
import { requiredChainId, networkConfig } from "../../config";
import { initializeBiconomy } from "../../biconomy";

export default function DocumentosPanel() {

    const [userAccount, setUserAccount] = useState(null); // Dirección de Smart Account
    const [userEOA, setUserEOA] = useState(null); // Dirección EOA
    const [loading, setLoading] = useState(false);
    const [smartAccount, setSmartAccount] = useState(null);
    const [signer, setSigner] = useState(null);
    const [whitelistedUsers, setWhitelistedUsers] = useState([]);
    const [newUser, setNewUser] = useState("");
    const [userName, setUserName] = useState(""); // Nuevo estado para el nombre del usuario
    const [owner, setOwner] = useState(null); // Estado para almacenar el owner
    const [isAdmin, setIsAdmin] = useState(false); // Estado para verificar si el usuario conectado es admin
    const [isTransactionPending, setIsTransactionPending] = useState(false); // Estado para gestionar transacciones pendientes
  

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

      
      } catch (error) {
        console.error("Error al conectar la wallet:", error);
        alert(`Error al conectar la wallet: ${error.message}`);
      }
    } else {
      alert("Por favor, instala MetaMask.");
    }
  };

  // Función para enviar transacciones utilizando Biconomy
  const sendTransactionWithBiconomy = async (to, data) => {
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
  };
  return (
    <div className="admin-panel-container">
      {/* Contenedor de Usuario */}
      <div className="adminUser" style={{ right: "100px", color: "white" }}>
        <UserInfo userEOA={userEOA} userAccount={userAccount} className={userEOA ? 'visible adminUser' : ''} />
      </div>

       {/* Contenedor Principal */}
       <div id="containerBody">
{/* Sección de Encabezado */}
<div id="headerSection">
          <img className="logo" src="/images/logo.svg" alt="logo" />
        </div>
  {/* Botón de Conectar */}
  <div className="center-text" style={{ marginTop: "20px" }}>
          {!userEOA && <WalletConnect onConnect={connectWallet} />}
        </div>

        </div>

      {/* Loader */}
      {loading && <Loader message="Cargando..." />}
    </div>
  );

}