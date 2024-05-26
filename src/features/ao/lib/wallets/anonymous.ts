import { AoSigner, AoWalletConnector } from "../aoWallet";
import { defaultArweave } from "../arweave";
import { ArweaveSigner, createData } from "warp-arbundles";

export const createAnonymousWallet: AoWalletConnector = async () => {
  try {
    const wallet = await defaultArweave.wallets.generate();
    const address = await defaultArweave.wallets.getAddress(wallet);

    const arweaveSigner = new ArweaveSigner(wallet);
    console.log(arweaveSigner);

    const dataItemSigner: AoSigner = async (...args: Parameters<AoSigner>) => {
      const transactionArgs = args[0];

      const tags = transactionArgs.tags
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

      return { id, raw }
    }

    return {
      success: true,
      result: {
        address,
        signer: dataItemSigner,
      }
    }
  } catch (error) {
    return {
      success: false,
      error,
    }
  }
}
