// src/biconomy.js
import { createSmartAccountClient } from "@biconomy/account";
import { networkConfig } from "./config";

console.log("Inicializando Biconomy con @biconomy/account");

export const initializeBiconomy = async (userSigner) => {
  try {
    if (!userSigner) {
      throw new Error("El signer del usuario no está definido.");
    }

    const smartAccount = await createSmartAccountClient({
      signer: userSigner, // Usar el signer del usuario
      bundlerUrl: import.meta.env.VITE_BUNDLER_URL,
      paymasterApiKey: import.meta.env.VITE_BICONOMY_API_KEY,
      chainId: networkConfig.id,
      rpcUrl: networkConfig.rpcUrls[0],
    });

    const smartAccountAddress = await smartAccount.getAccountAddress();
    console.log("Dirección de Smart Account:", smartAccountAddress);

    return smartAccount;
  } catch (error) {
    console.error("Error al inicializar Biconomy:", error);
    throw error;
  }
};
