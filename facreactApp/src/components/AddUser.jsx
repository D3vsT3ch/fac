// src/components/AddUser.jsx
import React, { useState } from "react";
import PropTypes from 'prop-types';
import { ethers } from "ethers";

export default function AddUser({ onUserAdded }) {
  const [newUser, setNewUser] = useState("");
  const [name, setName] = useState("");

  const handleAddUser = async () => {
    if (!ethers.utils.isAddress(newUser)) {
      alert("Por favor, ingresa una dirección de Ethereum válida.");
      return;
    }

    if (name.trim() === "") {
      alert("Por favor, ingresa un nombre para el usuario.");
      return;
    }

    try {
      const contract = new ethers.Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS,
        import.meta.env.VITE_CONTRACT_ABI,
        signer
      );

      await contract.addToWhitelist(newUser, name);
      alert("Usuario agregado a la whitelist.");
      setNewUser("");
      setName("");
      onUserAdded();
    } catch (error) {
      console.error("Error al agregar usuario a la whitelist:", error);
      alert("Error: " + error.message);
    }
  };

  return (
    <div>
      <h3>Añadir Nuevo Usuario a la Whitelist</h3>
      <input
        type="text"
        placeholder="Dirección de Ethereum"
        value={newUser}
        onChange={(e) => setNewUser(e.target.value)}
      />
      <input
        type="text"
        placeholder="Nombre del Usuario"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleAddUser}>Agregar a Whitelist</button>
    </div>
  );
}

AddUser.propTypes = {
  onUserAdded: PropTypes.func.isRequired,
};
