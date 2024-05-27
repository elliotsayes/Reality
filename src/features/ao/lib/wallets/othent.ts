import { createDataItemSigner } from "@permaweb/aoconnect";
import { AoWalletConnector } from "../aoWallet";
import { connect } from "@othent/kms";
import * as Othent from "@othent/kms";
import { ArweaveAddress } from "@/features/arweave/lib/model";

export const connectOthentWallet: AoWalletConnector = async (_, onDisconnect) => {
  try {
    const othentConnection = await connect();
    const address = othentConnection.walletAddress;

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
          if (activeAddress !== address) { // Changed wallets
            clearInterval(interval);
            window.arweaveWallet.disconnect();
            onDisconnect();
          }
        } catch (error) { // Wallet disconnected
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
      }
    }
  } catch (error) {
    return {
      success: false,
      error,
    }
  }
}
