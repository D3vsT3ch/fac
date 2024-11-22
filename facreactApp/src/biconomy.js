// src/biconomy.js

import { createSmartAccountClient, createPaymaster, PaymasterMode } from "@biconomy/account";
import { ethers } from "ethers";

export const initializeBiconomy = async (userSigner) => {
  try {
    if (!userSigner) {
      throw new Error("El signer del usuario no está definido.");
    }

    const provider = userSigner.provider;
    if (!provider) {
      throw new Error("El proveedor no está definido en el signer.");
    }

    // Logs para verificar las variables (elimina estos logs en producción)
    console.log("VITE_RPC_URL:", import.meta.env.VITE_RPC_URL);
    console.log("VITE_PAYMASTER_URL:", import.meta.env.VITE_PAYMASTER_URL);
    console.log("VITE_BICONOMY_API_KEY:", import.meta.env.VITE_BICONOMY_API_KEY);
    console.log("VITE_CHAIN_ID:", import.meta.env.VITE_CHAIN_ID);
    console.log("VITE_BUNDLER_URL:", import.meta.env.VITE_BUNDLER_URL);

    // Crear una instancia de Paymaster
    const paymaster = await createPaymaster({
      paymasterUrl: import.meta.env.VITE_PAYMASTER_URL,
      strictMode: false, // Cambiar a false para mayor flexibilidad
    });

    // Crear la Smart Account utilizando el Paymaster
    const smartAccount = await createSmartAccountClient({
      signer: userSigner,
      chainId: Number(import.meta.env.VITE_CHAIN_ID),
      bundlerUrl: import.meta.env.VITE_BUNDLER_URL,
      paymaster: paymaster,
      biconomyPaymasterApiKey: import.meta.env.VITE_BICONOMY_API_KEY,
    });

    // Obtener la dirección de la Smart Account correctamente
    const accountAddress = await smartAccount.getAccountAddress();
    console.log("Smart Account inicializado:", smartAccount);
    console.log("Dirección de Smart Account:", accountAddress);

    return smartAccount;
  } catch (error) {
    console.error("Error al inicializar Biconomy:", error);
    throw error;
  }
};
