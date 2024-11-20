// src/components/UserList.jsx
import React from "react";
import PropTypes from 'prop-types';
import { ethers } from "ethers";

export default function UserList({ admins, whitelistedUsers, signer, userAccount, onActionComplete }) {
  const contract = new ethers.Contract(
    import.meta.env.VITE_CONTRACT_ADDRESS,
    import.meta.env.VITE_CONTRACT_ABI,
    signer
  );

  // Función para revocar o conceder rol de administrador
  const toggleAdmin = async (address, isAdmin) => {
    try {
      if (isAdmin) {
        await contract.addAdmin(address, "Nombre del Admin"); // Puedes modificar para obtener el nombre
        alert('Rol de administrador concedido.');
      } else {
        await contract.removeAdmin(address);
        alert('Rol de administrador revocado.');
      }
      onActionComplete();
    } catch (error) {
      console.error("Error al modificar rol de administrador:", error);
      alert('Error: ' + error.message);
    }
  };

  // Función para eliminar usuario de la whitelist
  const removeFromWhitelist = async (address) => {
    try {
      await contract.removeFromWhitelist(address);
      alert('Usuario removido de la whitelist.');
      onActionComplete();
    } catch (error) {
      console.error("Error al eliminar usuario de la whitelist:", error);
      alert('Error: ' + error.message);
    }
  };

  return (
    <div>
      <h3>Administradores</h3>
      <table>
        <thead>
          <tr>
            <th>Dirección</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin, index) => (
            <tr key={index}>
              <td>{admin}</td>
              <td>
                {admin.toLowerCase() !== userAccount.toLowerCase() && (
                  <button onClick={() => toggleAdmin(admin, false)}>Revocar Admin</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Usuarios en Whitelist</h3>
      <table>
        <thead>
          <tr>
            <th>Dirección</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {whitelistedUsers.map((user, index) => (
            <tr key={index}>
              <td>{user}</td>
              <td>
                <button onClick={() => removeFromWhitelist(user)}>Eliminar de Whitelist</button>
                {user.toLowerCase() !== userAccount.toLowerCase() && (
                  <button onClick={() => toggleAdmin(user, true)}>Conceder Admin</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

UserList.propTypes = {
  admins: PropTypes.array.isRequired,
  whitelistedUsers: PropTypes.array.isRequired,
  signer: PropTypes.object.isRequired,
  userAccount: PropTypes.string.isRequired,
  onActionComplete: PropTypes.func.isRequired,
};
