import { queryOptions, useQuery } from "@tanstack/react-query";
import { profileInfoBatcher, profileInfoBatcherWallet } from "../utils/batch";
import { ProfileInfo } from "../contract/model";

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
      queryFn: async () => {
        const profileInfo = await profileInfoBatcher.fetch(opts.profileId);
        return profileInfo as ProfileInfo | undefined;
      },
    });
  } else if ("walletId" in opts) {
    queryOpts = queryOptions({
      queryKey: ["profileInfoWallet", opts.walletId],
      queryFn: async () => {
        const walletIdAndProfileInfo = await profileInfoBatcherWallet.fetch(
          opts.walletId,
        );
        return walletIdAndProfileInfo.profile;
      },
    });
  } else {
    throw new Error("Invalid opts");
  }

  return useQuery(queryOpts);
};
