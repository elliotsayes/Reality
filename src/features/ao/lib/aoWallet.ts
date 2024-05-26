import { createDataItemSigner } from "@permaweb/aoconnect";

export type AoWalletConnectionResult = {
  success: true;
  address: string;
  aoSigner: ReturnType<typeof createDataItemSigner>;
} | {
  success: false;
  error: unknown;
}

/**
 * Arweave wallet permission types
 */
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
