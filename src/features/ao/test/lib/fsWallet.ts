import { AoSigner, AoWalletConnector } from "../../lib/aoWallet";
import { defaultArweave } from "../../../arweave/lib/arweave";
import { ArweaveSigner, createData } from "warp-arbundles";
import { readFileSync } from "node:fs";

export const createFsWallet =
  (path: string, anonymous: boolean = false): AoWalletConnector =>
  async () => {
    try {
      const wallet = JSON.parse(readFileSync(path, "utf-8"));
      const address = await defaultArweave.wallets.getAddress(wallet);

      const arweaveSigner = new ArweaveSigner(wallet);

      const dataItemSigner: AoSigner = async (
        ...args: Parameters<AoSigner>
      ) => {
        const transactionArgs = args[0];

        const tags =
          transactionArgs.tags
            ?.filter((tag) => tag.name !== undefined && tag.value !== undefined)
            .map((tag) => ({
              name: tag.name!,
              value: tag.value!,
            })) ?? [];

        const dataItem = createData(transactionArgs.data, arweaveSigner, {
          tags,
          target: transactionArgs.target,
          anchor: transactionArgs.anchor,
        });
        await dataItem.sign(arweaveSigner);

        const id = await dataItem.id;
        const raw = dataItem.getRaw();

        return { id, raw };
      };

      return {
        success: true,
        result: {
          type: "Keyfile",
          anonymous,
          address,
          signer: dataItemSigner,
        },
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  };

export const loadTestWallet = async () => {
  const wallet = await createFsWallet("./fixtures/test_jwk.json")({
    permissionsRequested: [],
  });
  if (!wallet.success) {
    throw wallet.error;
  }
  return wallet.result;
};
