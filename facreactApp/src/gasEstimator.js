// src/gasEstimator.js

import { networkConfig } from "./config"; // Asegúrate de tener este archivo configurado

export const initializeGasEstimator = async () => {
  try {
    const gasEstimator = await createGasEstimator({
      rpcUrl: networkConfig.rpcUrls[0],
      // entryPointAddress es opcional si no necesitas especificarlo
    });
    console.log("Gas Estimator Inicializado:", gasEstimator);
    return gasEstimator;
  } catch (error) {
    console.error("Error al inicializar Gas Estimator:", error);
    throw error;
  }
};
