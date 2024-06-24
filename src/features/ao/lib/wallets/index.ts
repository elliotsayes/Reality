import { AoWalletConnector } from "../aoWallet";
import { connectInjectedWallet } from "./injected";
import { connectOthentWallet } from "./othent";
import { createGeneratedWallet } from "./generated";

export const WalletType = ["Injected", "Othent", "Keyfile"] as const;
export type WalletType = (typeof WalletType)[number];

export const wallets: Record<WalletType, AoWalletConnector> = {
  Injected: connectInjectedWallet,
  Othent: connectOthentWallet,
  Keyfile: createGeneratedWallet,
} as const;
