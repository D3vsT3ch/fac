// src/components/ProtectedRoute.jsx
import React, { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { SmartAccountContext } from "../context/SmartAccountContext.jsx";
import Loader from "./Loader.jsx";
import { ethers } from "ethers";
import PropTypes from 'prop-types';

export default function ProtectedRoute({ children }) {
  const { signer, userAccount } = useContext(SmartAccountContext);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!signer || !userAccount) {
        setLoading(false);
        return;
      }

      try {
        const contract = new ethers.Contract(
          import.meta.env.VITE_CONTRACT_ADDRESS,
          import.meta.env.VITE_CONTRACT_ABI,
          signer
        );

        const adminStatus = await contract.isAdmin(userAccount);
        setIsAdmin(adminStatus);
        setLoading(false);
      } catch (error) {
        console.error("Error al verificar el rol de administrador:", error);
        setIsAdmin(false);
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [signer, userAccount]);

  if (loading) {
    return <Loader message="Verificando permisos de administrador..." />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
