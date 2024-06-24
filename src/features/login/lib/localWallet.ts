import { createWalletFromJwk } from "@/features/ao/lib/wallets/jwk";
import { defaultArweave } from "@/features/arweave/lib/arweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import { dummyConnectConfig } from "./config";

export const getLocalWallet = async (localKeyLocalStorageKey: string) => {
  const storedJwkString = localStorage.getItem(localKeyLocalStorageKey);

  if (storedJwkString) {
    const storedJwk: JWKInterface = JSON.parse(storedJwkString);
    const creationResult = await createWalletFromJwk(
      storedJwk,
      true,
    )(dummyConnectConfig);
    if (creationResult.success) {
      return creationResult.result;
    } else {
      throw new Error("Failed to process local key");
    }
  }

  const newJwk = await defaultArweave.wallets.generate();
  createWalletFromJwk(newJwk, true)(dummyConnectConfig);
  localStorage.setItem(localKeyLocalStorageKey, JSON.stringify(newJwk));

  const creationResult = await createWalletFromJwk(
    newJwk,
    true,
  )(dummyConnectConfig);
  if (creationResult.success) {
    return creationResult.result;
  } else {
    throw new Error("Failed to process generated key");
  }
};
