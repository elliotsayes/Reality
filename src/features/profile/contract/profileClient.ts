import { ArweaveId } from "@/features/arweave/lib/model";
import { MessageId } from "../../ao/lib/aoClient";
import {
  AoContractClient,
  createAoContractClient,
} from "../../ao/lib/aoContractClient";
import { ProfileInfo, ProfileInfoCreate, ProfileInfoUpdate } from "./model";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";

export type ProfileClient = {
  aoContractClient: AoContractClient;

  // Reads
  readProfiles(profileIds: Array<ArweaveId>): Promise<Array<ProfileInfo>>;

  // Writes
  createProfile(profile: ProfileInfoCreate): Promise<MessageId>;
  updateProfile(profile: ProfileInfoUpdate): Promise<MessageId>;
};

// Placeholder
// TODO: Define these methods properly
export const createProfileClient = (
  aoContractClient: AoContractClient,
): ProfileClient => ({
  aoContractClient: aoContractClient,

  // Read
  readProfiles: async (profileIds: Array<ArweaveId>) => {
    if (profileIds.length === 0) {
      return [];
    }
    return aoContractClient.dryrunReadReplyOneJson<Array<ProfileInfo>>(
      {
        tags: [{ name: "Action", value: "Get-Metadata-By-ProfileIds" }],
        data: JSON.stringify({
          ProfileIds: profileIds,
        }),
      } /* Array<ProfileInfo> */,
    );
  },

  // Write
  createProfile: (profile: ProfileInfoCreate) =>
    aoContractClient.message({
      tags: [{ name: "Action", value: "Create-Profile" }],
      data: JSON.stringify(profile),
    }),
  updateProfile: (profile: ProfileInfoUpdate) =>
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
