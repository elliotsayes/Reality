import {
  AoContractClient,
  createAoContractClient,
} from "../../ao/lib/aoContractClient";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";
import { profileAOS } from "./config";
import { fetchUrl } from "@/features/arweave/lib/arweave";
import { ProfileInfoCreate } from "./model";

export type ProfileClient = {
  aoContractClient: AoContractClient;

  // Reads

  // Writes
  initializeProcess(): Promise<string>;
  updateProfile(profile: ProfileInfoCreate): Promise<string>;
};

// Placeholder
// TODO: Define these methods properly
export const createProfileClient = (
  aoContractClient: AoContractClient,
): ProfileClient => ({
  aoContractClient: aoContractClient,

  // Writes
  initializeProcess: async () => {
    const profileSrc = await fetch(fetchUrl(profileAOS.profileSrc)).then(
      (res) => res.text(),
    );
    const messageWithResult = await aoContractClient.messageWithResult({
      tags: [{ name: "Action", value: "Eval" }],
      data: profileSrc,
    });
    const error = messageWithResult.result.Error;
    if (error !== undefined) {
      throw new Error(error);
    }
    return messageWithResult.messageId;
  },
  updateProfile: async (profile: ProfileInfoCreate) =>
    aoContractClient.message({
      tags: [{ name: "Action", value: "Update-Profile" }],
      data: JSON.stringify(profile),
    }),
});

export const createProfileClientForProcess =
  (wallet: AoWallet) => (processId: string) => {
    const aoContractClient = createAoContractClient(
      processId,
      connect(),
      wallet,
    );
    return createProfileClient(aoContractClient);
  };
