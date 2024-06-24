import { WalletType } from ".";
import { AoWallet } from "../aoWallet";

export const dummyWallet: AoWallet = {
  type: "Dummy" as WalletType,
  anonymous: true,
  address: "Dummy Address",
  signer: function (
    args_0: {
      data?: any;
      tags?:
        | { name?: string | undefined; value?: string | undefined }[]
        | undefined;
      target?: string | undefined;
      anchor?: string | undefined;
    },
    ...args_1: unknown[]
  ): Promise<{ id?: string | undefined; raw?: any }> {
    throw new Error("Function not implemented.");
  },
};
