// src/components/pages/AdminPanel.jsx

import React, { useState, useEffect, useCallback } from "react";
import { ethers, utils } from "ethers";
import UserInfo from "../UserInfoDocumentos.jsx";
import WalletConnect from "../WalletConnect";
import Loader from "../Loader";

import { contractABI, contractAddress } from "../../contrato";
import "../../styles/App.css";
import { requiredChainId, networkConfig } from "../../config";
import { initializeBiconomy } from "../../biconomy";
import { PaymasterMode } from "@biconomy/account";
import axios from "axios";

export default function AdminPanel() {
  // Estados existentes
  const [userAccount, setUserAccount] = useState(null); // Dirección de Smart Account
  const [userEOA, setUserEOA] = useState(null); // Dirección EOA
  const [loading, setLoading] = useState(false);
  const [smartAccount, setSmartAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [whitelistedUsers, setWhitelistedUsers] = useState([]);
  const [newEOA, setNewEOA] = useState(""); // Estado para EOA
  const [newSmartAccount, setNewSmartAccount] = useState(""); // Estado para Smart Account
  const [newName, setNewName] = useState(""); // Estado para el nombre del usuario
  const [newRole, setNewRole] = useState(0); // Estado para Rol (0 = Usuario, 1 = Administrador)
  const [owner, setOwner] = useState(null); // Estado para almacenar el owner
  const [isAdmin, setIsAdmin] = useState(false); // Estado para verificar si el usuario conectado es admin
  const [isTransactionPending, setIsTransactionPending] = useState(false); // Estado para gestionar transacciones pendientes

  // Estados para manejar transacciones adicionales
  const [transactionHash, setTransactionHash] = useState(null);
  const [dataJson, setDataJson] = useState(null);
  const [status, setStatus] = useState('notSigned');
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
        setUserAccount(address.toLowerCase());
        console.log("Smart Account conectado:", address.toLowerCase());

        // Crear una instancia del contrato
        const contract = new ethers.Contract(contractAddress, contractABI, updatedSigner);

        // Obtener el owner del contrato
        console.log("Intentando obtener el owner del contrato...");
        const ownerAddress = await contract.owner();
        const lowerOwnerAddress = ownerAddress.toLowerCase();
        setOwner(lowerOwnerAddress);
        console.log("Owner Address obtenido:", lowerOwnerAddress);

        // Obtener la lista de administradores y la whitelist
        await fetchAdminAndWhitelist(contract, address.toLowerCase());

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

  // Función para obtener administradores y whitelist con reintentos
  const fetchAdminAndWhitelist = async (contract, userAccountAddress, retries = 3, delayTime = 2000) => {
    try {
      showLoading("Cargando administradores y lista blanca...");
      console.log("Obteniendo eventos UserWhitelisted, UserStatusChanged y RoleChanged...");

      // Definir los filtros de eventos
      const filterUserWhitelisted = contract.filters.UserWhitelisted();
      const filterUserStatusChanged = contract.filters.UserStatusChanged();
      const filterRoleChanged = contract.filters.RoleChanged();

      // Ejecutar las consultas en paralelo
      const [
        eventsUserWhitelisted,
        eventsUserStatusChanged,
        eventsRoleChanged
      ] = await Promise.all([
        contract.queryFilter(filterUserWhitelisted, 0, "latest"),
        contract.queryFilter(filterUserStatusChanged, 0, "latest"),
        contract.queryFilter(filterRoleChanged, 0, "latest"),
      ]);

      console.log("Eventos UserWhitelisted:", eventsUserWhitelisted);
      console.log("Eventos UserStatusChanged:", eventsUserStatusChanged);
      console.log("Eventos RoleChanged:", eventsRoleChanged);

      // Procesar eventos de la whitelist
      const whitelistMap = new Map();

      // Agregar usuarios de eventos UserWhitelisted
      eventsUserWhitelisted.forEach(event => {
        const { smartAccount, eoa, name, role } = event.args;
        whitelistMap.set(smartAccount.toLowerCase(), {
          eoa: eoa.toLowerCase(),
          name,
          role,
          isActive: true // Por defecto, al agregarlos, están activos
        });
      });

      // Procesar eventos de cambio de estado de usuario
      eventsUserStatusChanged.forEach(event => {
        const { smartAccount, newStatus } = event.args;
        const lowerSmartAccount = smartAccount.toLowerCase();
        if (whitelistMap.has(lowerSmartAccount)) {
          whitelistMap.get(lowerSmartAccount).isActive = newStatus;
        }
      });

      // Procesar eventos de cambio de rol
      eventsRoleChanged.forEach(event => {
        const { smartAccount, newRole } = event.args;
        const lowerSmartAccount = smartAccount.toLowerCase();
        if (whitelistMap.has(lowerSmartAccount)) {
          whitelistMap.get(lowerSmartAccount).role = newRole;
        }
      });

      console.log("Mapa de Whitelist después de procesar eventos:", whitelistMap);

      // Construir el array de usuarios con su estado de administrador y activo
      const whitelistArray = Array.from(whitelistMap.entries()).map(([smartAccount, user]) => ({
        smartAccount,
        eoa: user.eoa,
        name: user.name,
        isAdmin: user.role === 1, // Role.ADMIN = 1
        isActive: user.isActive
      }));

      console.log("Whitelist Actualizada:", whitelistArray);

      // Crear el conjunto de administradores
      const adminSet = new Set(
        whitelistArray
          .filter(user => user.isAdmin)
          .map(user => user.smartAccount)
      );

      console.log("Lista de Administradores:", adminSet);

      // Actualizar el estado
      setWhitelistedUsers(whitelistArray);
      setIsAdmin(adminSet.has(userAccountAddress.toLowerCase()));
      setOwner(adminSet.has(userAccountAddress.toLowerCase()) ? userAccountAddress.toLowerCase() : owner);
      hideLoading();

      // Verificar si el usuario está en la whitelist
      await checkWhitelist(userAccountAddress);

    } catch (error) {
      console.error("Error al obtener administradores y la whitelist:", error);
      if (retries > 0) {
        console.log(`Reintentando fetchAdminAndWhitelist... Intentos restantes: ${retries}`);
        setTimeout(() => fetchAdminAndWhitelist(contract, userAccountAddress, retries - 1, delayTime), delayTime);
      } else {
        alert("No se pudo cargar administradores y la lista blanca después de varios intentos. Por favor, intenta de nuevo más tarde.");
        hideLoading();
      }
    }
  };

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
          setWhitelistedUsers([]);
          setOwner(null);
          setIsAdmin(false);
          setIsWhitelisted(false);
          setTransactionHash(null);
          setDataJson(null);
          setStatus('notSigned');
          console.log("Wallet desconectada");
        }
      };

      const handleChainChanged = (chainId) => {
        console.log("Chain cambiada a:", chainId);
        // Intentar cambiar automáticamente a la red deseada
        // No recargar la página inmediatamente
        connectWallet();
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

  // Función para enviar transacciones utilizando Biconomy con Paymaster
  const sendTransactionWithBiconomy = async (to, data) => {
    if (!smartAccount) {
      throw new Error("La Smart Account no está inicializada.");
    }

    const tx = {
      to,
      data,
      // Puedes agregar más campos como value si es necesario
    };

    const userOpResponse = await smartAccount.sendTransaction(tx, {
      paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });
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
    if (!newEOA || !newSmartAccount || !newName) {
      alert("Por favor, proporciona la dirección EOA, la Smart Account y el nombre del usuario.");
      return;
    }

    if (!utils.isAddress(newEOA)) {
      alert("Por favor, proporciona una dirección EOA válida.");
      return;
    }

    if (!utils.isAddress(newSmartAccount)) {
      alert("Por favor, proporciona una dirección de Smart Account válida.");
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
      setStatus('signing');
      showLoading("Agregando usuario a la whitelist...");

      console.log("Enviando transacción utilizando el SDK de Biconomy...");

      // Preparar los datos de la transacción
      const data = encodeFunctionCall('addToWhitelist', [newEOA, newSmartAccount, newName, newRole]);

      // Enviar la transacción usando Biconomy con Paymaster
      const receipt = await sendTransactionWithBiconomy(contractAddress, data);
      console.log("Transaction receipt", receipt);

      alert("Usuario agregado exitosamente a la whitelist.");

      // Limpiar los campos de entrada
      setNewEOA("");
      setNewSmartAccount("");
      setNewName("");
      setNewRole(0); // Resetear el rol a Usuario

      // Actualizar la whitelist
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      await fetchAdminAndWhitelist(contract, userAccount);

      hideLoading();
      setStatus('signed');
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
      setStatus('error');
    }
  };

  // Función para conceder o revocar rol de administrador usando Biconomy
  const toggleAdmin = async (smartAccountAddress, isCurrentlyAdmin) => {
    if (!smartAccountAddress) return;

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
      showLoading(`${isCurrentlyAdmin ? "Revocando" : "Concediendo"} rol de administrador...`);

      // Crear una instancia del contrato
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Preparar los datos de la transacción
      const data = encodeFunctionCall('changeRole', [smartAccountAddress, isCurrentlyAdmin ? 0 : 1]); // Role.USER = 0, Role.ADMIN = 1
      console.log("Datos codificados para changeRole:", data);

      // Enviar la transacción usando Biconomy con Paymaster
      await sendTransactionWithBiconomy(contractAddress, data);
      console.log(`Rol de administrador ${isCurrentlyAdmin ? "revocado" : "concedido"} para: ${smartAccountAddress}`);

      // Actualizar la whitelist
      await fetchAdminAndWhitelist(contract, userAccount);

      hideLoading();
      setIsTransactionPending(false);
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

  // Función para habilitar o deshabilitar usuario usando Biconomy
  const toggleUserStatus = async (smartAccountAddress, isCurrentlyActive) => {
    if (!smartAccountAddress) return;

    if (!isAdmin) {
      alert("Solo los administradores pueden gestionar usuarios.");
      return;
    }

    if (isTransactionPending) {
      alert("Por favor, espera a que la transacción anterior se confirme.");
      return;
    }

    try {
      setIsTransactionPending(true);
      showLoading(`${isCurrentlyActive ? "Deshabilitando" : "Habilitando"} usuario...`);

      // Crear una instancia del contrato
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Preparar los datos de la transacción
      const data = encodeFunctionCall('changeUserStatus', [smartAccountAddress, !isCurrentlyActive]);
      console.log("Datos codificados para changeUserStatus:", data);

      // Enviar la transacción usando Biconomy con Paymaster
      await sendTransactionWithBiconomy(contractAddress, data);
      console.log(`Usuario ${isCurrentlyActive ? "deshabilitado" : "habilitado"}: ${smartAccountAddress}`);

      // Actualizar la whitelist
      await fetchAdminAndWhitelist(contract, userAccount);

      hideLoading();
      setIsTransactionPending(false);
    } catch (error) {
      console.error(`Error al ${isCurrentlyActive ? "deshabilitar" : "habilitar"} usuario:`, error);
      hideLoading();
      setIsTransactionPending(false);
      let errorMessage = `Ocurrió un error al ${isCurrentlyActive ? "deshabilitar" : "habilitar"} el usuario.`;
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

          {/* Verificar si el usuario está en la whitelist */}
          {!isWhitelisted && userEOA && !loading && (
            <div className="permission-denied" style={{ textAlign: 'center', marginTop: '50px' }}>
              <p style={{ color: 'red', fontSize: '18px' }}>
                No tienes permisos para acceder al panel de administración.
              </p>
            </div>
          )}

          {/* Mostrar el panel de administración solo si el usuario está en la whitelist */}
          {isWhitelisted && (
            <>
              {/* Añadir nuevo usuario */}
              <div className="flexH gap30 margin46">
                <div className="flex1">
                  <label className="titleLabel">
                    Añadir nuevo usuario
                  </label>
                  <div className="containerInput">
                    <label className="titleLabel labelW">EOA</label>
                    <label className="titleLabel labelW">Smart Account</label>
                    <label className="titleLabel labelW">Nombre</label>
                    <label className="titleLabel labelW">Rol</label>
                    <br></br>
                    <input
                      className="inputText"
                      type="text"
                      placeholder="Dirección EOA de Ethereum"
                      value={newEOA}
                      onChange={(e) => setNewEOA(e.target.value)}
                    />
                    <input
                      className="inputText"
                      type="text"
                      placeholder="Dirección de Smart Account"
                      value={newSmartAccount}
                      onChange={(e) => setNewSmartAccount(e.target.value)}
                      style={{ marginLeft: "10px" }}
                    />
                    <input
                      className="inputText"
                      type="text"
                      placeholder="Nombre del Usuario"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      style={{ marginLeft: "10px" }}
                    />
                    {/* Campo de selección para Rol */}
                    <select
                      className="inputText"
                      value={newRole}
                      onChange={(e) => setNewRole(parseInt(e.target.value))}
                      style={{ marginLeft: "10px", padding: "8px" }}
                    >
                      <option value={0}>Usuario</option>
                      <option value={1}>Administrador</option>
                    </select>
                    <button
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
                        <th align="center">EOA</th>
                        <th align="center">Smart Account</th>
                        <th align="center">Nombre</th>
                        <th align="center">Rol</th>
                        <th align="center">Estado</th>
                        <th align="center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {whitelistedUsers.length > 0 ? (
                        whitelistedUsers.map((user) => (
                          <tr key={user.smartAccount}>
                            <td align="center">{user.eoa}</td>
                            <td align="center">{user.smartAccount}</td>
                            <td align="center">{user.name}</td>
                            <td align="center">{user.isAdmin ? "Administrador" : "Usuario"}</td>
                            <td align="center">{user.isActive ? "Activo" : "Inactivo"}</td>
                            <td align="center">
                              {/* Mostrar botones solo si el usuario conectado es un administrador y no está gestionando su propia cuenta */}
                              {isAdmin && user.smartAccount !== userAccount && (
                                <>
                                  {/* Botón de Toggle Admin */}
                                  <button
                                    className="iconAction"
                                    style={{ marginLeft: "10px" }}
                                    onClick={() => toggleAdmin(user.smartAccount, user.isAdmin)}
                                    disabled={isTransactionPending}
                                  >
                                    {user.isAdmin ? (
                                      <img src="../images/icon_remove_admin.svg" alt="Revocar rol de administrador" />
                                    ) : (
                                      <img src="../images/icon_up_admin.svg" alt="Conceder rol de administrador" />
                                    )}
                                  </button>

                                  {/* Botón para habilitar/deshabilitar Usuario */}
                                  <button
                                    className="iconAction"
                                    style={{ marginLeft: "10px" }}
                                    onClick={() => toggleUserStatus(user.smartAccount, user.isActive)}
                                    disabled={isTransactionPending}
                                  >
                                    {user.isActive ? (
                                      <img src="../images/icon_disable.svg" alt="Deshabilitar Usuario" />
                                    ) : (
                                      <img src="../images/icon_enable.svg" alt="Habilitar Usuario" />
                                    )}
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" align="center">
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
                      await fetchAdminAndWhitelist(contract, userAccount);
                    } catch (error) {
                      console.error("Error al refrescar la lista:", error);
                    }
                  }}
                  disabled={isTransactionPending}
                >
                  Refrescar lista
                </button>
              </div>

              {/* Sección para Manejar Transacciones Adicionales */}
              {userEOA && dataJson && isWhitelisted && status === 'notSigned' && (
                <div className="transactionSection">
                  <div className="centerText margin20">
                    <button
                      id="actionButton"
                      onClick={sendTransactionWithSDK} // Usar el método del SDK con Paymaster
                      disabled={isTransactionPending}
                    >
                      Firmar Documento
                    </button>
                  </div>
                </div>
              )}

              {/* Mostrar Hash de Transacción */}
              <div className="centerText margin20">
                {transactionHash && <p>Transacción exitosa: {transactionHash}</p>}
              </div>

              {/* Mensajes de Estado */}
              {status === 'error' && (
                <p style={{ color: 'red' }}>Ocurrió un error. Inténtalo de nuevo.</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Loader */}
      {loading && <Loader message="Cargando..." />}
    </div>
  );
}

// Función para codificar la llamada a la función del contrato
const encodeFunctionCall = (functionName, params) => {
  const iface = new ethers.utils.Interface(contractABI);
  return iface.encodeFunctionData(functionName, params);
};
