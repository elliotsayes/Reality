import { createDataItemSigner } from "@permaweb/aoconnect";
import { AoWalletConnector, ConnectConfig } from "../aoWallet";
import { ArweaveAddress } from "@/features/arweave/lib/model";

export const connectInjectedWallet: AoWalletConnector = async (
  config: ConnectConfig,
  onDisconnect?: () => void,
) => {
  if (!window.arweaveWallet) {
    return {
      success: false,
      error: "No injected wallet",
    };
  }

  try {
    await window.arweaveWallet.connect(
      config.permissionsRequested,
      config.appInfo,
      config.gateway,
    );
    // TODO: Confirm that permissions have been granted
    const permissionsGranted = await window.arweaveWallet.getPermissions();
    if (
      config.permissionsRequired &&
      !config.permissionsRequired.every((permission) =>
        permissionsGranted.includes(permission),
      )
    ) {
      await window.arweaveWallet.disconnect();
      return {
        success: false,
        error: "Insufficient permissions granted",
      };
    }

    const address = await window.arweaveWallet.getActiveAddress();

    if (!ArweaveAddress.safeParse(address).success) {
      return {
        success: false,
        error: "No valid address",
      };
    }

    let interval: NodeJS.Timeout | undefined;
    if (onDisconnect) {
      // Repeatedly check for the address until it is un available
      interval = setInterval(async () => {
        try {
          const activeAddress = await window.arweaveWallet.getActiveAddress();
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
      },
      disconnect: async () => {
        clearInterval(interval);
        await window.arweaveWallet.disconnect();
      },
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
};
