//src/contrato.js

export const contractABI = [
  {
    "inputs": [],
    "name": "InvalidInitialization",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotInitializing",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "docHash",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "uploader",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "eoa",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "key",
        "type": "string"
      }
    ],
    "name": "DocumentSaved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "version",
        "type": "uint64"
      }
    ],
    "name": "Initialized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "smartAccount",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum Fac.Role",
        "name": "oldRole",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "enum Fac.Role",
        "name": "newRole",
        "type": "uint8"
      }
    ],
    "name": "RoleChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "smartAccount",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "newStatus",
        "type": "bool"
      }
    ],
    "name": "UserStatusChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "smartAccount",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "eoa",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "enum Fac.Role",
        "name": "role",
        "type": "uint8"
      }
    ],
    "name": "UserWhitelisted",
    "type": "event"
  },
  {
    "stateMutability": "payable",
    "type": "fallback"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_eoa",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_smartAccount",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "enum Fac.Role",
        "name": "_role",
        "type": "uint8"
      }
    ],
    "name": "addToWhitelist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_smartAccount",
        "type": "address"
      },
      {
        "internalType": "enum Fac.Role",
        "name": "_newRole",
        "type": "uint8"
      }
    ],
    "name": "changeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_smartAccount",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_newStatus",
        "type": "bool"
      }
    ],
    "name": "changeUserStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllDocuments",
    "outputs": [
      {
        "internalType": "bytes32[]",
        "name": "",
        "type": "bytes32[]"
      },
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      },
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      },
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      },
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      },
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_docHash",
        "type": "bytes32"
      }
    ],
    "name": "getDocument",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTrustedForwarder",
    "outputs": [
      {
        "internalType": "address",
        "name": "forwarder",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_smartAccount",
        "type": "address"
      }
    ],
    "name": "isAdmin",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "forwarder",
        "type": "address"
      }
    ],
    "name": "isTrustedForwarder",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_smartAccount",
        "type": "address"
      }
    ],
    "name": "isWhitelisted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_data",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "_eoa",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "_key",
        "type": "string"
      }
    ],
    "name": "saveDocument",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_trustedForwarder",
        "type": "address"
      }
    ],
    "name": "setTrustedForwarder",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "versionRecipient",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
]; // Tu ABI aquí
  

  // Dirección de tu contrato inteligente
export const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

// Clave API de Biconomy
export const apiKey = import.meta.env.VITE_BICONOMY_API_KEY;



// URLs de RPC
export const rpcUrls = import.meta.env.VITE_RPC_URL;

// Nombre de la cadena
export const chainName = import.meta.env.VITE_CHAIN_NAME;

// URLs del explorador de bloques
export const blockExplorerUrls = import.meta.env.VITE_BLOCK_EXPLORER_URL;

// Nombre de la moneda nativa
export const nameCoint = import.meta.env.VITE_COIN_NAME;

// Símbolo de la moneda nativa
export const coint = import.meta.env.VITE_COIN_SYMBOL;

// URL del Paymaster de Biconomy
export const paymasterUrl = import.meta.env.VITE_PAYMASTER_URL;

// ID del Paymaster de Biconomy
export const paymasterId = import.meta.env.VITE_PAYMASTER_ID;

// URL del Bundler de Biconomy
export const bundlerUrl = import.meta.env.VITE_BUNDLER_URL;

// Configuración de la red
// src/config.js
export const networkConfig = {
  id: 80002, // ID de la red
  chainIdHex: "0x13882", // 80002 en hexadecimal
  name: "Polygon Amoy Test Network",
  network: "polygon-amoy",
  rpcUrls: ["https://rpc-amoy.polygon.technology"], // URL del nodo RPC
  nativeCurrency: {
    name: "POL", // Nombre de la moneda
    symbol: "POL", // Símbolo de la moneda
    decimals: 18,
  },
  blockExplorers: {
    default: { name: "PolygonScan", url: "https://amoy.polygonscan.com/" }, // Explorador de bloques
  },
};

// Exporta `requiredChainId` basado en la configuración de la red
export const requiredChainId = networkConfig.id;