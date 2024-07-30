import { queryOptions, useQuery } from "@tanstack/react-query";
import { profileInfoBatcherWallet } from "../utils/batch";

type WalletIdOrProfileId =
  | {
      walletId: string;
    }
  | {
      profileId: string;
    };

export const useProfileInfo = (opts: WalletIdOrProfileId) => {
  // check if profileId is defined
  let queryOpts;
  if ("profileId" in opts) {
    queryOpts = queryOptions({
      queryKey: ["profileInfo", opts.profileId],
      queryFn: async () => profileInfoBatcherWallet.fetch(opts.profileId),
    });
  } else if ("walletId" in opts) {
    queryOpts = queryOptions({
      queryKey: ["profileInfoWallet", opts.walletId],
      queryFn: async () => profileInfoBatcherWallet.fetch(opts.walletId),
    });
  } else {
    throw new Error("Invalid opts");
  }

  return useQuery(queryOpts);
};
