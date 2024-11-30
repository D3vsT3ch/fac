// src/config.js

const {
  VITE_BICONOMY_API_KEY,
  VITE_PAYMASTER_URL,
  VITE_PAYMASTER_ID,
  VITE_BUNDLER_URL,
  VITE_CHAIN_ID,
  VITE_RPC_URL,
  VITE_CHAIN_NAME,
  VITE_BLOCK_EXPLORER_URL,
  VITE_COIN_NAME,
  VITE_COIN_SYMBOL,
  VITE_CONTRACT_ADDRESS,
} = import.meta.env;

// Validar que todas las variables necesarias están definidas
const requiredEnvVars = [
  "VITE_BICONOMY_API_KEY",
  "VITE_PAYMASTER_URL",
  "VITE_PAYMASTER_ID",
  "VITE_BUNDLER_URL",
  "VITE_CHAIN_ID",
  "VITE_RPC_URL",
  "VITE_CHAIN_NAME",
  "VITE_BLOCK_EXPLORER_URL",
  "VITE_COIN_NAME",
  "VITE_COIN_SYMBOL",
  "VITE_CONTRACT_ADDRESS",
];

requiredEnvVars.forEach((varName) => {
  if (!import.meta.env[varName]) {
    console.error(`Error: La variable de entorno ${varName} no está definida.`);
  }
});

export const networkConfig = {
  id: parseInt(VITE_CHAIN_ID, 10), // ID de la red
  chainIdHex: `0x${parseInt(VITE_CHAIN_ID, 10).toString(16)}`, // Convertir ID a hexadecimal
  name: VITE_CHAIN_NAME || "Polygon",
  network: VITE_CHAIN_NAME ? VITE_CHAIN_NAME.toLowerCase() : "polygon",
  rpcUrls: [VITE_RPC_URL], // URL del nodo RPC
  nativeCurrency: {
    name: VITE_COIN_NAME, // Nombre de la moneda
    symbol: VITE_COIN_SYMBOL, // Símbolo de la moneda
    decimals: 18,
  },
  blockExplorerUrls: [VITE_BLOCK_EXPLORER_URL],
};

// Exporta `requiredChainId` basado en la configuración de la red
export const requiredChainId = networkConfig.id;
