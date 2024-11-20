// src/components/AdminPanel.jsx
import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { ethers } from "ethers";
import UserList from "./UserList";
import AddUser from "./AddUser";
import Loader from "./Loader";
import { contractABI, contractAddress } from "../contrato";

export default function AdminPanel({ smartAccount, signer, userAccount }) {
  const [admins, setAdmins] = useState([]);
  const [whitelistedUsers, setWhitelistedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Función para cargar administradores y usuarios en whitelist
  const loadAdminData = async () => {
    if (!signer) return;

    try {
      setLoading(true);
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      // Obtener administradores y usuarios en whitelist
      const adminsList = await contract.getAdmins();
      const whitelistList = await contract.getWhitelistedUsers();

      setAdmins(adminsList);
      setWhitelistedUsers(whitelistList);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar datos de administración:", error);
      alert("Error al cargar datos de administración: " + error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [signer, userAccount]);

  return (
    <div>
      <h2>Panel de Administración</h2>
      <AddUser onUserAdded={loadAdminData} />
      {loading ? (
        <Loader message="Cargando datos de administración..." />
      ) : (
        <UserList
          admins={admins}
          whitelistedUsers={whitelistedUsers}
          signer={signer}
          userAccount={userAccount}
          onActionComplete={loadAdminData}
        />
      )}
    </div>
  );
}

AdminPanel.propTypes = {
  smartAccount: PropTypes.object,
  signer: PropTypes.object,
  userAccount: PropTypes.string,
};
