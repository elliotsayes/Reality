import { AoWalletConnector, ConnectConfig } from "../aoWallet";
import { defaultArweave } from "../../../arweave/lib/arweave";
import { createWalletFromJwk } from "./jwk";
import { JWKInterface } from "arweave/node/lib/wallet";

export const createGeneratedWallet: AoWalletConnector = async (
  config: ConnectConfig,
) => {
  let jwk: JWKInterface;

  try {
    jwk = await defaultArweave.wallets.generate();
  } catch (error) {
    return {
      success: false,
      error,
    };
  }

  const wallet = await createWalletFromJwk(jwk, false)(config);
  return wallet;
};
