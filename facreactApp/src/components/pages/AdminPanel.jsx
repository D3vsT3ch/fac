// src/components/pages/AdminPanel.jsx
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import UserInfo from "../UserInfo";
import WalletConnect from "../WalletConnect";
import Loader from "../Loader";
import UserList from "../UserList";
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
  const [admins, setAdmins] = useState([]);
  const [whitelistedUsers, setWhitelistedUsers] = useState([]);
  const [newUser, setNewUser] = useState("");

  // Aquí puedes agregar tus useEffect y lógica adicional

  return (
    <div className="admin-panel-container">
      {/* Contenedor de Usuario */}
      <div
        style={{  right: "50px", color: "white" }}
      >
          <UserInfo userEOA={userEOA} userAccount={userAccount} className={userEOA ? 'visible' : ''} />
      </div>

      {/* Contenedor Principal */}
      <div id="containerBody">
        {/* Sección de Encabezado */}
        <div id="headerSection">
          <img className="logo" src="/images/logo.svg" alt="logo" />
        </div>

        {/* Botón de Conectar */}
        <div className="center-text" style={{ marginTop: "20px" }}>
          <WalletConnect />
        </div>

        {/* Contenido Principal */}
        <div id="bodySection" className="hide-on-load">
          <div className="space50"></div>
          <div className="center-text margin-bottom-50">
            <div className="title-admin">
              Gestión de cuentas en la whitelist
            </div>
          </div>

          {/* Añadir nuevo usuario */}
          <div className="flex-h gap-30 margin-46">
            <div className="flex1">
              <label htmlFor="addAccount" className="title-label">
                Añadir nuevo usuario
              </label>
              <div className="container-input">
                <input
                  id="addAccount"
                  className="input-text"
                  type="text"
                  placeholder="Dirección de Ethereum"
                  value={newUser}
                  onChange={(e) => setNewUser(e.target.value)}
                />
                <img
                  id="addAccountButton"
                  className="icon-action"
                  src="/images/icon_more.svg"
                  alt="Añadir"
                  // Puedes agregar un manejador de eventos onClick aquí más tarde
                />
              </div>
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="flex-h gap-30 margin-46 container-table">
            <div className="flex1">
              <div className="center-text margin-33">
                <div className="title-label">Usuarios</div>
              </div>
              <table id="userTable" cellSpacing="0">
                <thead>
                  <tr>
                    <th align="center">Cuenta</th>
                    <th align="center">Rol</th>
                    <th align="center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                 
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Loader (Opcional) */}
      {loading && <Loader />}
    </div>
  );
}
