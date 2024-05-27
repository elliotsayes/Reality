import { createDataItemSigner } from "@permaweb/aoconnect";
import { AppInfo, GatewayConfig, PermissionType, AoWalletConnector } from "../aoWallet";
import { ArweaveAddress } from "@/features/arweave/lib/model";

export const connectInjectedWallet: AoWalletConnector = async (
  config: {
    permissions: PermissionType[],
    appInfo?: AppInfo,
    gateway?: GatewayConfig,
  },
  onDisconnect?: () => void,
) => {
  if (!window.arweaveWallet) {
    return {
      success: false,
      error: "No injected wallet",
    }
  }

  try {
    await window.arweaveWallet.connect(config.permissions, config.appInfo, config.gateway);
    // TODO: Confirm that permissions have been granted

    const address = await window.arweaveWallet.getActiveAddress();

    if (!ArweaveAddress.safeParse(address).success) {
      return {
        success: false,
        error: "No valid address",
      }
    }

    if (onDisconnect) {
      // Repeatedly check for the address until it is un available
      const interval = setInterval(async () => {
        try {
          const activeAddress = await window.arweaveWallet.getActiveAddress()
          if (activeAddress !== address) {
            clearInterval(interval);
            window.arweaveWallet.disconnect();
            onDisconnect();
          }
        } catch (error) {
          clearInterval(interval);
          onDisconnect();
        }
      }, 100);
    }

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
