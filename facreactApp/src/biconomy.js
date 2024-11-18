// src/biconomy.js
import { createNexusClient, createBicoPaymasterClient } from "@biconomy/sdk";
import { baseSepolia } from "viem/chains"; 
import { http } from "viem"; 
import { privateKeyToAccount } from "viem/accounts";
import {
  contractABI,
  contractAddress,
  requiredChainId,
  rpcUrls,
  chainName,
  blockExplorerUrls,
  nameCoint,
  coint,
  paymasterUrl,
  paymasterId,
  bundlerUrl,
} from "./contrato";

export const initializeBiconomy = async () => {
  try {
    const privateKey = import.meta.env.VITE_PRIVATE_KEY;
    const account = privateKeyToAccount(`0x${privateKey}`);

    const nexusClient = await createNexusClient({
      signer: account,
      chain: baseSepolia,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      paymaster: createBicoPaymasterClient({ paymasterUrl }),
    });

    const smartAccountAddress = await nexusClient.account.address;
    console.log("Smart Account Address:", smartAccountAddress);

    return nexusClient;
  } catch (error) {
    console.error("Error al inicializar Biconomy:", error);
    throw error;
  }
};
