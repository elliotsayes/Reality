import { create, keyResolver, windowScheduler } from "@yornaath/batshit";
import { createProfileRegistryClientForProcess } from "../contract/profileRegistryClient";
import { dummyWallet } from "@/features/ao/lib/wallets/dummy";
import { ArweaveAddress, ArweaveId } from "@/features/arweave/lib/model";
import { ProfileEntry } from "../contract/model";

const registryClient = createProfileRegistryClientForProcess(dummyWallet)(
  import.meta.env.VITE_PROFILE_PROCESS_ID,
);

export const profileInfoBatcher = create({
  fetcher: async (ids: ArweaveId[]) => {
    console.log("profileInfoBatcher", ids);

    const profiles = await registryClient.readProfiles(ids);

    console.log({ profiles });
    return profiles;
  },
  resolver: keyResolver("ProfileId"),
  scheduler: windowScheduler(50), // Default and can be omitted.
});

export const profileInfoBatcherWallet = create({
  fetcher: async (walletIds: ArweaveAddress[]) => {
    console.log("profileInfoBatcherWallet", walletIds);

    const previousWallets = new Set<ArweaveAddress>();
    const walletProfiles =
      await registryClient.getProfilesByAddresses(walletIds);

    const firstWalletProfiles: Array<ProfileEntry> = [];
    for (const profile of walletProfiles) {
      if (!previousWallets.has(profile.CallerAddress)) {
        firstWalletProfiles.push(profile);
        previousWallets.add(profile.CallerAddress);
      }
    }

    const profileInfos = await registryClient.readProfiles(
      walletProfiles.map((x) => x.ProfileId),
    );

    // Match the walletIds back up with the profileInfos
    const walletsWithProfiles = walletIds.map((walletId) => {
      const profileId = firstWalletProfiles.find(
        (x) => x.CallerAddress === walletId,
      )?.ProfileId;
      const profile = profileInfos.find((x) => x.ProfileId === profileId);
      return { walletId, profile };
    });

    return walletsWithProfiles;
  },
  resolver: keyResolver("walletId"),
  scheduler: windowScheduler(50), // Default and can be omitted.
});
