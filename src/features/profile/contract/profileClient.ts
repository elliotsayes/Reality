import {
  AoContractClient,
  createAoContractClient,
} from "../../ao/lib/aoContractClient";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";
import { profileAOS } from "./config";
import { fetchUrl } from "@/features/arweave/lib/arweave";
import { ProfileInfoCreate } from "./model";
import { Message, MessageResult } from "@/features/ao/lib/aoClient";

export type ProfileClient = {
  aoContractClient: AoContractClient;

  // Reads
  grabProfileAssets(): Promise<Message>;

  // Writes
  initializeProcess(): Promise<MessageResult>;
  updateProfile(profile: ProfileInfoCreate): Promise<string>;
};

// Placeholder
// TODO: Define these methods properly
export const createProfileClient = (
  aoContractClient: AoContractClient,
): ProfileClient => ({
  aoContractClient: aoContractClient,

  // Reads
  grabProfileAssets: async () => {
    const message = await aoContractClient.dryrunReadReplyOne({
      tags: [{ name: "Action", value: "Info" }],
    });
    console.log(message, '  ', message.Data)
    return message;
  },

  // Writes
  initializeProcess: async () => {
    const profileSrc = await fetch(fetchUrl(profileAOS.profileSrc)).then(
      (res) => res.text(),
    );
    const messageResult = await aoContractClient.messageResult({
      tags: [{ name: "Action", value: "Eval" }],
      data: profileSrc,
    });
    const error = messageResult.Error;
    if (error !== undefined) {
      throw new Error(error);
    }
    return messageResult;
  },
  updateProfile: async (profile: ProfileInfoCreate) =>
    aoContractClient.message({
      tags: [{ name: "Action", value: "Update-Profile" }],
      data: JSON.stringify(profile),
    }),
});

export type ProfileClientForProcess = (processId: string) => ProfileClient;

export const createProfileClientForProcess =
  (wallet: AoWallet): ProfileClientForProcess => (processId: string) => {
    const aoContractClient = createAoContractClient(
      processId,
      connect(),
      wallet,
    );
    return createProfileClient(aoContractClient);
  };
