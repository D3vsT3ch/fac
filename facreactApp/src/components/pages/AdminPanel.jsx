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

  // Función optimizada para obtener administradores y whitelist
  const fetchAdminAndWhitelist = async (contract, userEOAAddress, retries = 3, delayTime = 2000) => {
    try {
      showLoading("Cargando administradores y lista blanca...");
      console.log("Obteniendo eventos AdminAdded, AdminRemoved, UserWhitelisted y UserRemovedFromWhitelist...");

      // Definir los filtros de eventos
      const filterAdminAdded = contract.filters.AdminAdded();
      const filterAdminRemoved = contract.filters.AdminRemoved();
      const filterUserWhitelisted = contract.filters.UserWhitelisted();
      const filterUserRemoved = contract.filters.UserRemovedFromWhitelist();

      // Ejecutar las consultas en paralelo
      const [
        eventsAdminAdded,
        eventsAdminRemoved,
        eventsUserWhitelisted,
        eventsUserRemoved
      ] = await Promise.all([
        contract.queryFilter(filterAdminAdded, 0, "latest"),
        contract.queryFilter(filterAdminRemoved, 0, "latest"),
        contract.queryFilter(filterUserWhitelisted, 0, "latest"),
        contract.queryFilter(filterUserRemoved, 0, "latest"),
      ]);

      console.log("Eventos AdminAdded:", eventsAdminAdded);
      console.log("Eventos AdminRemoved:", eventsAdminRemoved);
      console.log("Eventos UserWhitelisted:", eventsUserWhitelisted);
      console.log("Eventos UserRemovedFromWhitelist:", eventsUserRemoved);

      // Procesar eventos de administradores
      const adminMap = new Map();
      eventsAdminAdded.forEach(event => {
        const { admin, name } = event.args;
        adminMap.set(admin.toLowerCase(), name);
      });

      eventsAdminRemoved.forEach(event => {
        const { admin } = event.args;
        adminMap.delete(admin.toLowerCase());
      });

      const adminSet = new Set(adminMap.keys());
      console.log("Lista de Administradores:", adminSet);

      // Procesar eventos de la whitelist
      const whitelistMap = new Map();
      eventsUserWhitelisted.forEach(event => {
        const { user, name } = event.args;
        whitelistMap.set(user.toLowerCase(), name);
      });

      eventsUserRemoved.forEach(event => {
        const { user } = event.args;
        whitelistMap.delete(user.toLowerCase());
      });

      console.log("Mapa de Whitelist:", whitelistMap);

      // Construir el array de usuarios con su estado de administrador
      const whitelistArray = Array.from(whitelistMap.entries()).map(([address, name]) => ({
        address,
        name,
        isAdmin: adminSet.has(address.toLowerCase()), // Determinar si es admin
      }));

      console.log("Whitelist Actualizada:", whitelistArray);

      // Actualizar el estado
      setWhitelistedUsers(whitelistArray);
      setIsAdmin(adminSet.has(userEOAAddress.toLowerCase()));
      setOwner(adminSet.has(userEOAAddress.toLowerCase()) ? userEOAAddress.toLowerCase() : owner);
      hideLoading();
    } catch (error) {
      console.error("Error al obtener administradores y la whitelist:", error);
      if (retries > 0) {
        console.log(`Reintentando fetchAdminAndWhitelist... Intentos restantes: ${retries}`);
        setTimeout(() => fetchAdminAndWhitelist(contract, userEOAAddress, retries - 1, delayTime), delayTime);
      } else {
        alert("No se pudo cargar administradores y la lista blanca después de varios intentos. Por favor, intenta de nuevo más tarde.");
        hideLoading();
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

        // Obtener la lista de administradores y la whitelist
        await fetchAdminAndWhitelist(contract, lowerEoaAddress);
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

    if (isTransactionPending) {
      alert("Por favor, espera a que la transacción anterior se confirme.");
      return;
    }

    try {
      setIsTransactionPending(true);
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

      // Crear una instancia del contrato con el signer actualizado
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Esperar un breve momento antes de actualizar la whitelist
      setTimeout(async () => {
        await fetchAdminAndWhitelist(contract, userEOA);
        setIsTransactionPending(false);
      }, 5000); // 5 segundos de retraso para asegurar la confirmación

      hideLoading();
    } catch (error) {
      console.error("Error al agregar usuario a la whitelist:", error);
      hideLoading();
      setIsTransactionPending(false);
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

    if (isTransactionPending) {
      alert("Por favor, espera a que la transacción anterior se confirme.");
      return;
    }

    try {
      setIsTransactionPending(true);
      showLoading("Eliminando usuario de la whitelist...");
      const lowerAddress = address.toLowerCase();

      // Verificar si el usuario es admin
      const isUserAdmin = whitelistedUsers.find(user => user.address === lowerAddress)?.isAdmin;

      // Crear una instancia del contrato
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

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

      // Esperar un breve momento antes de actualizar la whitelist
      setTimeout(async () => {
        await fetchAdminAndWhitelist(contract, userEOA);
        setIsTransactionPending(false);
      }, 5000); // 5 segundos de retraso para asegurar la confirmación

      hideLoading();
    } catch (error) {
      console.error("Error al eliminar usuario de la whitelist:", error);
      hideLoading();
      setIsTransactionPending(false);
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

    if (!isAdmin) {
      alert("Solo los administradores pueden gestionar administradores.");
      return;
    }

    if (isTransactionPending) {
      alert("Por favor, espera a que la transacción anterior se confirme.");
      return;
    }

    try {
      setIsTransactionPending(true);

      
      // Crear una instancia del contrato
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      if (isCurrentlyAdmin) {
        console.log(address)
        console.log(isCurrentlyAdmin)
        // Revocar rol de administrador
        showLoading("Revocando rol de administrador...");
        const iface = new ethers.utils.Interface(contractABI);
        const data = iface.encodeFunctionData('removeAdmin', [address]);
        console.log("Datos codificados para removeAdmin:", data);

        // Enviar la transacción usando Biconomy
        await sendTransactionWithBiconomy(contractAddress, data);
        console.log("Rol de administrador revocado para:", address);
      } else {
        console.log(address)
        console.log(isCurrentlyAdmin)
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

      // Esperar un breve momento antes de actualizar la whitelist
      setTimeout(async () => {
        await fetchAdminAndWhitelist(contract, userEOA);
        setIsTransactionPending(false);
      }, 5000); // 5 segundos de retraso para asegurar la confirmación

      hideLoading();
    } catch (error) {
      console.error(`Error al ${isCurrentlyAdmin ? "revocar" : "conceder"} rol de administrador:`, error);
      hideLoading();
      setIsTransactionPending(false);
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
          // Reconectar para actualizar estados y datos
          connectWallet();
        } else {
          setUserEOA(null);
          setUserAccount(null);
          setWhitelistedUsers([]);
          setOwner(null);
          setIsAdmin(false);
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
                  disabled={isTransactionPending}
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
                          {/* Mostrar botones solo si el usuario conectado es un administrador y no está gestionando su propia cuenta */}
                          {isAdmin && user.address !== userEOA && (
                            <>
                              {/* Botón de Toggle Admin */}
                              <button
                                className="iconAction"
                                style={{ marginLeft: "10px" }}
                                onClick={() => toggleAdmin(user.address, user.isAdmin)}
                                disabled={isTransactionPending}
                              >
                                {user.isAdmin ? (
                                  <img src="../images/icon_remove_admin.svg" alt="Revocar rol de administrador" />
                                ) : (
                                  <img src="../images/icon_remove_admin.svg" alt="Conceder rol de administrador" />
                                )}
                              </button>

                              {/* Botón para Eliminar Usuario */}
                              <button
                                className="iconAction"
                                onClick={() => removeUserFromWhitelist(user.address)}
                                style={{ marginLeft: "10px" }}
                                disabled={isTransactionPending}
                              >
                                <img src="../images/icon_delete.svg" alt="Eliminar" />
                              </button>
                            </>
                          )}
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

          {/* Botón de Refresco Manual */}
          <div className="centerText margin20">
            <button
              className="refresh-button"
              onClick={async () => {
                try {
                  const contract = new ethers.Contract(contractAddress, contractABI, signer);
                  await fetchAdminAndWhitelist(contract, userEOA);
                } catch (error) {
                  console.error("Error al refrescar la lista:", error);
                }
              }}
              disabled={isTransactionPending}
            >
              Refrescar Lista
            </button>
          </div>
        </div>
      </div>

      {/* Loader */}
      {loading && <Loader message="Cargando..." />}
    </div>
  );
}
