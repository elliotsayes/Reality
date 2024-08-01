import { create, keyResolver, windowScheduler } from "@yornaath/batshit";
import { createProfileRegistryClientForProcess } from "../contract/profileRegistryClient";
import { dummyWallet } from "@/features/ao/lib/wallets/dummy";
import { ArweaveAddress, ArweaveId } from "@/features/arweave/lib/model";
import { ProfileEntry, ProfileInfo } from "../contract/model";

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

    const walletProfiles =
      await registryClient.getProfilesByAddresses(walletIds);

    const foundWallets = new Set<ArweaveAddress>();
    const firstWalletProfiles: Array<ProfileEntry> = [];
    for (const profile of walletProfiles) {
      if (!foundWallets.has(profile.CallerAddress)) {
        foundWallets.add(profile.CallerAddress);
        firstWalletProfiles.push(profile);
      }
    }

    const profileInfos = await registryClient.readProfiles(
      walletProfiles.map((x) => x.ProfileId),
    );

    // Match the walletIds back up with the profileInfos
    const walletsWithProfiles = walletIds
      .map((walletId) => {
        const profileId = firstWalletProfiles.find(
          (x) => x.CallerAddress === walletId,
        )?.ProfileId;
        const profile = profileInfos.find((x) => x.ProfileId === profileId);
        return { walletId, profile };
      })
      .filter((x) => x.profile !== undefined) as Array<{
      walletId: ArweaveAddress;
      profile: ProfileInfo;
    }>;

    return walletsWithProfiles;
  },
  resolver: keyResolver("walletId"),
  scheduler: windowScheduler(50), // Default and can be omitted.
});
