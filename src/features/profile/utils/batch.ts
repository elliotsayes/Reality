import { create, keyResolver, windowScheduler } from "@yornaath/batshit";
import { createProfileRegistryClientForProcess } from "../contract/profileRegistryClient";
import { dummyWallet } from "@/features/ao/lib/wallets/dummy";
import { ArweaveAddress, ArweaveId } from "@/features/arweave/lib/model";
import { ProfileEntry } from "../contract/model";

const registryClient = createProfileRegistryClientForProcess(dummyWallet)(
  import.meta.env.VITE_PROFILE_PROCESS_ID,
);

export const profileIdBatcher = create({
  fetcher: async (ids: ArweaveAddress[]) => {
    console.log("profileIdBatcher", ids);

    const allProfileIds: Array<ProfileEntry> = [];
    // TODO: There is not batch API, so query individually :(
    for (const id of ids) {
      const walletProfiles = await registryClient.getProfilesByAddress(id);
      if (walletProfiles) allProfileIds.push(walletProfiles[0]);
    }

    console.log({ allProfileIds });
    return allProfileIds;
  },
  resolver: keyResolver("CallerAddress"),
  scheduler: windowScheduler(50), // Default and can be omitted.
});

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

    const allProfileIds: Array<ProfileEntry> = [];
    // TODO: There is not batch API, so query individually :(
    for (const walletId of walletIds) {
      const walletProfiles =
        await registryClient.getProfilesByAddress(walletId);
      console.log(`Wallet profiles for ${walletId}`, walletProfiles);

      if (walletProfiles && walletProfiles.length > 0) {
        const primaryProfile = walletProfiles[0];
        console.log("Primary profile", primaryProfile);
        allProfileIds.push(primaryProfile);
      } else {
        console.log("No profile found for", walletId);
      }
    }
    const profileInfos = await registryClient.readProfiles(
      allProfileIds.map((x) => x.ProfileId),
    );

    // Match the walletIds back up with the profileInfos
    const walletsWithProfiles = walletIds.map((walletId) => {
      const profileId = allProfileIds.find(
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
