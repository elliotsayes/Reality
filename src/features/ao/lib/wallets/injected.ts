import { createDataItemSigner } from "node_modules/@permaweb/aoconnect/dist/client/node/wallet";
import { AppInfo, GatewayConfig, PermissionType, AoWalletConnector } from "../aoWallet";

export const connectInjectedWallet: AoWalletConnector = async (
  permissions: PermissionType[],
  appInfo?: AppInfo,
  gateway?: GatewayConfig,
) => {
  if (!window.arweaveWallet) {
    return {
      success: false,
      error: "No injected wallet",
    }
  }

  try {
    await window.arweaveWallet.connect(permissions, appInfo, gateway);
    const address = await window.arweaveWallet.getActiveAddress();

    return {
      success: true,
      address,
      aoSigner: createDataItemSigner(window.arweaveWallet),
    }
  } catch (error) {
    return {
      success: false,
      error,
    }
  }
}
