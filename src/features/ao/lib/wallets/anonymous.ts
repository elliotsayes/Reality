import { createDataItemSigner } from "@permaweb/aoconnect";
import { AoWalletConnector } from "../aoWallet";
import { defaultArweave } from "../arweave";

export const createAnonymousWallet: AoWalletConnector = async () => {
  try {
    const wallet = await defaultArweave.wallets.generate();
    const address = await defaultArweave.wallets.getAddress(wallet);

    return {
      success: true,
      address,
      aoSigner: createDataItemSigner(wallet),
    }
  } catch (error) {
    return {
      success: false,
      error,
    }
  }
}
