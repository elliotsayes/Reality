import { createDataItemSigner } from "@permaweb/aoconnect";
import { AoWalletConnector } from "../aoWallet";
import { connect } from "@othent/kms";
import * as Othent from "@othent/kms";

export const connectOthentWallet: AoWalletConnector = async () => {
  try {
    const result = await connect();
    const address = result.walletAddress;
    
    return {
      success: true,
      address,
      aoSigner: createDataItemSigner(Othent),
    }
  } catch (error) {
    return {
      success: false,
      error,
    }
  }
}
