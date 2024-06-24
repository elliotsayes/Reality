import { ArweaveId } from "@/features/arweave/lib/model";
import {
  AoContractClient,
  createAoContractClient,
} from "../../ao/lib/aoContractClient";
import { ProfileInfo } from "./model";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";

export type ProfileRegistryClient = {
  aoContractClient: AoContractClient;

  // Reads
  readProfiles(profileIds: Array<ArweaveId>): Promise<Array<ProfileInfo>>;
};

// Placeholder
// TODO: Define these methods properly
export const createProfileRegistryClient = (
  aoContractClient: AoContractClient,
): ProfileRegistryClient => ({
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
});

export const createProfileRegistryClientForProcess =
  (wallet: AoWallet) => (processId: string) => {
    const aoContractClient = createAoContractClient(
      processId,
      connect(),
      wallet,
    );
    return createProfileRegistryClient(aoContractClient);
  };
