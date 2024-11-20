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

export default function AdminPanel() {
  const [userAccount, setUserAccount] = useState(null); // Dirección de Smart Account
  const [userEOA, setUserEOA] = useState(null); // Dirección EOA
  const [loading, setLoading] = useState(false);
  const [smartAccount, setSmartAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [whitelistedUsers, setWhitelistedUsers] = useState([]);
  const [newUser, setNewUser] = useState("");
  const [userName, setUserName] = useState(""); // Nuevo estado para el nombre del usuario
  const [owner, setOwner] = useState(null); // Estado para almacenar el owner
  const [isOwner, setIsOwner] = useState(false); // Estado para verificar si el usuario conectado es el owner

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
        setUserEOA(eoaAddress.toLowerCase());
        console.log("Dirección EOA del usuario:", eoaAddress);

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
        console.log("Owner Address obtenido:", ownerAddress);
        const lowerOwnerAddress = ownerAddress.toLowerCase();
        setOwner(lowerOwnerAddress);
        setIsOwner(eoaAddress.toLowerCase() === lowerOwnerAddress);
        console.log(`¿Eres el propietario? ${isOwner}`);

        // Obtener la lista de whitelist y admins
        await fetchWhitelist(contract, lowerOwnerAddress);
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

  // Función para obtener la lista de administradores
  const fetchAdmins = async (contract) => {
    try {
      console.log("Obteniendo eventos AdminAdded y AdminRemoved...");
      const filterAdminAdded = contract.filters.AdminAdded();
      const filterAdminRemoved = contract.filters.AdminRemoved();

      const eventsAdded = await contract.queryFilter(filterAdminAdded, 0, "latest");
      const eventsRemoved = await contract.queryFilter(filterAdminRemoved, 0, "latest");

      console.log("Eventos AdminAdded:", eventsAdded);
      console.log("Eventos AdminRemoved:", eventsRemoved);

      const adminMap = new Map();

      eventsAdded.forEach(event => {
        const { admin, name } = event.args;
        adminMap.set(admin.toLowerCase(), name);
      });

      eventsRemoved.forEach(event => {
        const { admin } = event.args;
        adminMap.delete(admin.toLowerCase());
      });

      // Convertir el mapa a un Set de direcciones
      const adminSet = new Set(adminMap.keys());

      console.log("Lista de Administradores:", adminSet);

      return adminSet;
    } catch (error) {
      console.error("Error al obtener los admins:", error);
      return new Set();
    }
  };

  // Función para obtener la whitelist de eventos
  const fetchWhitelist = async (contract, ownerAddress) => { // Recibir ownerAddress como parámetro
    try {
      showLoading("Cargando lista blanca...");
      console.log("Obteniendo eventos UserWhitelisted y UserRemovedFromWhitelist...");

      // Obtener todos los eventos de UserWhitelisted y UserRemovedFromWhitelist
      const filterWhitelisted = contract.filters.UserWhitelisted();
      const filterRemoved = contract.filters.UserRemovedFromWhitelist();

      const eventsWhitelisted = await contract.queryFilter(filterWhitelisted, 0, "latest");
      const eventsRemoved = await contract.queryFilter(filterRemoved, 0, "latest");

      console.log("Eventos UserWhitelisted:", eventsWhitelisted);
      console.log("Eventos UserRemovedFromWhitelist:", eventsRemoved);

      const whitelistMap = new Map();

      // Procesar los eventos de UserWhitelisted
      eventsWhitelisted.forEach(event => {
        const { user, name } = event.args;
        whitelistMap.set(user.toLowerCase(), name);
      });

      // Procesar los eventos de UserRemovedFromWhitelist
      eventsRemoved.forEach(event => {
        const { user } = event.args;
        whitelistMap.delete(user.toLowerCase());
      });

      console.log("Mapa de Whitelist:", whitelistMap);

      // Convertir el mapa a un array de objetos
      const whitelistArray = Array.from(whitelistMap.entries()).map(([address, name]) => ({
        address,
        name,
        isAdmin: false, // Inicialmente falso
      }));

      // Obtener la lista de administradores
      const adminSet = await fetchAdmins(contract);

      // Incluir al propietario como administrador
      if (ownerAddress) {
        adminSet.add(ownerAddress.toLowerCase());
      }

      console.log("Lista de Administradores Actualizada:", adminSet);

      // Actualizar el array de whitelist con el estado de admin
      const updatedWhitelist = whitelistArray.map(user => ({
        ...user,
        isAdmin: adminSet.has(user.address),
      }));

      console.log("Whitelist Actualizada:", updatedWhitelist);

      setWhitelistedUsers(updatedWhitelist);
      hideLoading();
    } catch (error) {
      console.error("Error al obtener la whitelist:", error);
      hideLoading();
    }
  };

  // Función para agregar un nuevo usuario a la whitelist usando Biconomy
  const addUserToWhitelist = async () => {
    if (!newUser || !userName) {
      alert("Por favor, proporciona la dirección y el nombre del usuario.");
      return;
    }

    if (!utils.isAddress(newUser)) {
      alert("Por favor, proporciona una dirección Ethereum válida.");
      return;
    }

    if (!smartAccount) {
      alert("La Smart Account no está inicializada.");
      return;
    }

    try {
      showLoading("Agregando usuario a la whitelist...");

      // Codificar la llamada a la función del contrato
      const iface = new ethers.utils.Interface(contractABI);
      const data = iface.encodeFunctionData('addToWhitelist', [newUser, userName]);
      console.log("Datos codificados de la transacción:", data);

      // Enviar la transacción usando Biconomy
      const receipt = await sendTransactionWithBiconomy(contractAddress, data);
      console.log("Transaction receipt", receipt);

      alert("Usuario agregado exitosamente a la whitelist.");

      // Limpiar los campos de entrada
      setNewUser("");
      setUserName("");

      // Actualizar la whitelist
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      await fetchWhitelist(contract, owner);

      hideLoading();
    } catch (error) {
      console.error("Error al agregar usuario a la whitelist:", error);
      hideLoading();
      let errorMessage = "Ocurrió un error al agregar el usuario.";
      if (error.data && error.data.message) {
        errorMessage = error.data.message;
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert("Error: " + errorMessage);
    }
  };

  // Función para eliminar un usuario de la whitelist y revocar admin si aplica
  const removeUserFromWhitelist = async (address) => {
    if (!address) return;

    try {
      showLoading("Eliminando usuario de la whitelist...");

      const lowerAddress = address.toLowerCase();

      // Verificar si el usuario es admin
      const isUserAdmin = whitelistedUsers.find(user => user.address === lowerAddress)?.isAdmin;

      if (isUserAdmin) {
        // Revocar rol de administrador primero
        console.log("El usuario es administrador. Revocando rol de administrador...");

        // Codificar la llamada a la función removeAdmin
        const ifaceRemoveAdmin = new ethers.utils.Interface(contractABI);
        const dataRemoveAdmin = ifaceRemoveAdmin.encodeFunctionData('removeAdmin', [address]);
        console.log("Datos codificados para removeAdmin:", dataRemoveAdmin);

        // Enviar la transacción para revocar admin usando Biconomy
        await sendTransactionWithBiconomy(contractAddress, dataRemoveAdmin);
        console.log("Rol de administrador revocado para:", address);
      }

      // Ahora, eliminar de la whitelist

      // Codificar la llamada a la función removeFromWhitelist
      const ifaceRemoveWhitelist = new ethers.utils.Interface(contractABI);
      const dataRemoveWhitelist = ifaceRemoveWhitelist.encodeFunctionData('removeFromWhitelist', [address]);
      console.log("Datos codificados para removeFromWhitelist:", dataRemoveWhitelist);

      // Enviar la transacción para eliminar de la whitelist usando Biconomy
      await sendTransactionWithBiconomy(contractAddress, dataRemoveWhitelist);
      console.log("Usuario eliminado de la whitelist:", address);

      alert("Usuario eliminado exitosamente de la whitelist.");

      // Actualizar la whitelist
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      await fetchWhitelist(contract, owner);

      hideLoading();
    } catch (error) {
      console.error("Error al eliminar usuario de la whitelist:", error);
      hideLoading();
      let errorMessage = "Ocurrió un error al eliminar el usuario.";
      if (error.data && error.data.message) {
        errorMessage = error.data.message;
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert("Error: " + errorMessage);
    }
  };

  // Función para conceder o revocar rol de administrador usando Biconomy
  const toggleAdmin = async (address, isCurrentlyAdmin) => {
    if (!address) return;

    if (!isOwner) {
      alert("Solo el propietario puede gestionar administradores.");
      return;
    }

    try {
      if (isCurrentlyAdmin) {
        // Revocar rol de administrador
        showLoading("Revocando rol de administrador...");
        const iface = new ethers.utils.Interface(contractABI);
        const data = iface.encodeFunctionData('removeAdmin', [address]);
        console.log("Datos codificados para removeAdmin:", data);

        // Enviar la transacción usando Biconomy
        await sendTransactionWithBiconomy(contractAddress, data);
        console.log("Rol de administrador revocado para:", address);
      } else {
        // Conceder rol de administrador
        showLoading("Concediendo rol de administrador...");
        const iface = new ethers.utils.Interface(contractABI);
        const name = whitelistedUsers.find(user => user.address.toLowerCase() === address.toLowerCase())?.name || "Administrador";
        const data = iface.encodeFunctionData('addAdmin', [address, name]);
        console.log("Datos codificados para addAdmin:", data);

        // Enviar la transacción usando Biconomy
        await sendTransactionWithBiconomy(contractAddress, data);
        console.log("Rol de administrador concedido a:", address);
      }

      // Actualizar la whitelist
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      await fetchWhitelist(contract, owner);
      hideLoading();
    } catch (error) {
      console.error(`Error al ${isCurrentlyAdmin ? "revocar" : "conceder"} rol de administrador:`, error);
      hideLoading();
      let errorMessage = `Ocurrió un error al ${isCurrentlyAdmin ? "revocar" : "conceder"} el rol de administrador.`;
      if (error.data && error.data.message) {
        errorMessage = error.data.message;
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert("Error: " + errorMessage);
    }
  };

  // Manejar cambios en la cuenta o en la red
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setUserEOA(accounts[0].toLowerCase());
          console.log("Cuenta cambiada a:", accounts[0]);
          // Puedes agregar lógica adicional aquí si es necesario
        } else {
          setUserEOA(null);
          setUserAccount(null);
          setWhitelistedUsers([]);
          setOwner(null);
          setIsOwner(false);
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
  }, []);

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

        {/* Contenido Principal */}
        <div
          id="bodySection"
          className={userEOA ? "visible" : "hide-on-load"} // Clase dinámica
        >
          <div className="space50"></div>
          <div className="centerText marginBottom50">
            <div className="titleAdmin">
              Gestión de cuentas en la whitelist
            </div>
          </div>

          {/* Añadir nuevo usuario */}
          <div className="flexH gap30 margin46">
            <div className="flex1">
              <label htmlFor="addAccount" className="titleLabel">
                Añadir nuevo usuario
              </label>
              <div className="containerInput">
                <label htmlFor="addAccount" className="titleLabel labelW" >
                  Wallet
                </label>
                <label htmlFor="addAccount" className="titleLabel labelW">
                  Usuario
                </label>
                <br></br>
                <input
                  id="addAccount"
                  className="inputText"
                  type="text"
                  placeholder="Dirección de Ethereum"
                  value={newUser}
                  onChange={(e) => setNewUser(e.target.value)}
                />
                <input
                  id="addUserName"
                  className="inputText"
                  type="text"
                  placeholder="Nombre del Usuario"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  style={{ marginLeft: "10px" }}
                />
                <button
                  id="addAccountButton"
                  className="iconAction"
                  onClick={addUserToWhitelist}
                  style={{ marginLeft: "10px" }}
                >
                  <img src="../images/icon_more.svg" alt="Agregar" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="flexH gap30 margin46 containerTable">
            <div className="flex1">
              <div className="centerText margin33">
                <div className="titleLabel">Usuarios</div>
              </div>
              <table id="userTable" cellSpacing="0">
                <thead>
                  <tr>
                    <th align="center">Dirección</th>
                    <th align="center">Nombre</th>
                    <th align="center">Rol</th>
                    <th align="center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {whitelistedUsers.length > 0 ? (
                    whitelistedUsers.map((user) => (
                      <tr key={user.address}>
                        <td align="center">{user.address}</td>
                        <td align="center">{user.name}</td>
                        <td align="center">{user.isAdmin ? "Administrador" : "Usuario"}</td>
                        <td align="center">
                          {user.address.toLowerCase() !== owner && isOwner && (
                            <button
                              className="action-button"
                              onClick={() => toggleAdmin(user.address, user.isAdmin)}
                            >
                              {user.isAdmin ? "Revocar Admin" : "Conceder Admin"}
                            </button>
                          )}

                          <button
                            className="iconAction"
                            style={{ marginLeft: "10px" }}
                          >
                            <img src="../images/icon_group_users.svg" alt="Conceder rol de administrador" />
                          </button>
                          <button
                            className="iconAction"
                            onClick={() => removeUserFromWhitelist(user.address)}
                            style={{ marginLeft: "10px" }}
                          >
                            <img src="../images/icon_delete.svg" alt="Eliminar" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" align="center">
                        No hay usuarios en la whitelist.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Loader (Opcional) */}
      {loading && <Loader message="Cargando..." />}
    </div>
  );
}
