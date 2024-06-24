import { AoSigner, AoWalletConnector } from "../aoWallet";
import { defaultArweave } from "../../../arweave/lib/arweave";
import { ArweaveSigner, createData } from "warp-arbundles";
import { JWKInterface } from "arweave/node/lib/wallet";

export const createWalletFromJwk =
  (jwk: JWKInterface, anonymous: boolean): AoWalletConnector =>
  async () => {
    try {
      const address = await defaultArweave.wallets.getAddress(jwk);

      const arweaveSigner = new ArweaveSigner(jwk);

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
