import { AoWalletConnector } from "../aoWallet";
import { connectInjectedWallet } from "./injected";
import { connectOthentWallet } from "./othent";
import { createGeneratedWallet } from "./generated";
import { connectEthereumWallet } from "./ethereum";

export const WalletType = ["Injected", "Othent", "Keyfile", "Ethereum"] as const;
export type WalletType = typeof WalletType[number];

export  const wallets: Record<WalletType, AoWalletConnector> = {
  "Injected": connectInjectedWallet,
  "Othent": connectOthentWallet,
  "Keyfile": createGeneratedWallet,
  "Ethereum": connectEthereumWallet,
} as const;
