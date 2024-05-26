import { createDataItemSigner } from "@permaweb/aoconnect";
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
    // TODO: Confirm that permissions have been granted

    const address = await window.arweaveWallet.getActiveAddress();

    return {
      success: true,
      result: {
        type: "Injected",
        anonymous: false,
        address,
        signer: createDataItemSigner(window.arweaveWallet),
      }
    }
  } catch (error) {
    return {
      success: false,
      error,
    }
  }
}
