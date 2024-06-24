import { connect } from "@permaweb/aoconnect";
import { profileAOS } from "./config";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { createProfileClientForProcess } from "./profileClient";
import { ProfileInfoCreate } from "./model";

export const spawnProfileProcess = async (
  wallet: AoWallet,
  initialProfile?: ProfileInfoCreate,
): Promise<string> => {
  const spawnClient = connect();
  const profileId = await spawnClient.spawn({
    module: profileAOS.module,
    scheduler: profileAOS.scheduler,
    tags: profileAOS.getTags(),
    signer: wallet.signer,
  });
  // TODO: Do we have to confirm that the process has been spawned?
  const profileClient = createProfileClientForProcess(wallet)(profileId);
  await profileClient.initializeProcess();
  if (initialProfile !== undefined) {
    await profileClient.updateProfile(initialProfile);
  }
  return profileId;
};
