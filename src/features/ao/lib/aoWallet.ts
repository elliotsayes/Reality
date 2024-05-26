import { createDataItemSigner } from "@permaweb/aoconnect";

export type AoSigner = ReturnType<typeof createDataItemSigner>

export type AoWallet = {
  address: string;
  signer: AoSigner;
}

export type AoWalletConnectionResult = {
  success: true;
  result: AoWallet;
} | {
  success: false;
  error: unknown;
}

// TODO: Import these from somewhere more official
export type PermissionType =
  | "ACCESS_ADDRESS"
  | "ACCESS_PUBLIC_KEY"
  | "ACCESS_ALL_ADDRESSES"
  | "SIGN_TRANSACTION"
  | "ENCRYPT"
  | "DECRYPT"
  | "SIGNATURE"
  | "ACCESS_ARWEAVE_CONFIG"
  | "DISPATCH";

export interface AppInfo {
  name?: string;
  logo?: string;
}

export interface GatewayConfig {
  host: string;
  port: number;
  protocol: "http" | "https";
}

export type AoWalletConnector = (
  permissions: PermissionType[],
  appInfo?: AppInfo,
  gateway?: GatewayConfig,
) => Promise<AoWalletConnectionResult>;
