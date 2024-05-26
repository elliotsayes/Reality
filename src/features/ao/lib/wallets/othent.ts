import { createDataItemSigner } from "@permaweb/aoconnect";
import { AoWalletConnector } from "../aoWallet";
import { connect } from "@othent/kms";
import * as Othent from "@othent/kms";

export const connectOthentWallet: AoWalletConnector = async () => {
  try {
    const othentConnection = await connect();
    const address = othentConnection.walletAddress;
    
    return {
      success: true,
      result: {
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
