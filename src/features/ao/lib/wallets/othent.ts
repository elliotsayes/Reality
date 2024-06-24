import { createDataItemSigner } from "@permaweb/aoconnect";
import { AoWalletConnector } from "../aoWallet";
import { connect } from "@othent/kms";
import * as Othent from "@othent/kms";
import { ArweaveAddress } from "@/features/arweave/lib/model";

export const connectOthentWallet: AoWalletConnector = async (
  _,
  onDisconnect,
) => {
  try {
    const othentConnection = await connect();
    const address = othentConnection.walletAddress;

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
          const activeAddress = await Othent.getActiveAddress();
          if (activeAddress !== address) {
            // Changed wallets
            clearInterval(interval);
            Othent.disconnect();
            onDisconnect();
          }
        } catch (error) {
          // Wallet disconnected
          clearInterval(interval);
          onDisconnect();
        }
      }, 100);
    }

    return {
      success: true,
      result: {
        type: "Othent",
        anonymous: false,
        address,
        signer: createDataItemSigner(Othent),
      },
      disconnect: async () => {
        clearInterval(interval);
        await Othent.disconnect();
      },
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
};
