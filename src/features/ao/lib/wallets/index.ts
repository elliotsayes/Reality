import { AoWalletConnector } from "../aoWallet";
import { connectInjectedWallet } from "./injected";
import { connectOthentWallet } from "./othent";
import { createAnonymousWallet } from "./anonymous";

export const WalletType = ["Injected", "Othent", "Keyfile"] as const;
export type WalletType = typeof WalletType[number];

export  const wallets: Record<WalletType, AoWalletConnector> = {
  "Injected": connectInjectedWallet,
  "Othent": connectOthentWallet,
  "Keyfile": createAnonymousWallet,
} as const;
