// src/biconomy.js
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygonAmoy } from "viem/chains";
import { createSmartAccountClient } from "@biconomy/account";
import { networkConfig } from "./config";

export const initializeBiconomy = async (userSigner) => {
  console.log("Inicializando Biconomy con @biconomy/account");
  try {
    if (!userSigner) {
      throw new Error("El signer del usuario no está definido.");
    }

    const smartAccount = await createSmartAccountClient({
      signer: userSigner,
      chainId: networkConfig.id,
      bundlerUrl: import.meta.env.VITE_BUNDLER_URL,
      paymasterUrl: import.meta.env.VITE_PAYMASTER_URL,
      paymasterId: import.meta.env.VITE_PAYMASTER_ID,
    });

    console.log("Smart Account inicializado:", smartAccount);

    const smartAccountAddress = await smartAccount.getAccountAddress();
    console.log("Dirección de Smart Account:", smartAccountAddress);

    return smartAccount;
  } catch (error) {
    console.error("Error al inicializar Biconomy:", error);
    throw error;
  }
};
