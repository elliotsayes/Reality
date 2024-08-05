import { ArweaveId } from "@/features/arweave/lib/model";
import {
  AoContractClient,
  createAoContractClient,
} from "../../ao/lib/aoContractClient";
import { ProfileEntry, ProfileInfo } from "./model";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";

export type ProfileRegistryClient = {
  aoContractClient: AoContractClient;

  // Reads
  getProfilesByAddress(address: ArweaveId): Promise<Array<ProfileEntry>>;
  getProfilesByAddresses(
    addresses: Array<ArweaveId>,
  ): Promise<Array<ProfileEntry>>;
  readProfiles(profileIds: Array<ArweaveId>): Promise<Array<ProfileInfo>>;
};

// Placeholder
// TODO: Define these methods properly
export const createProfileRegistryClient = (
  aoContractClient: AoContractClient,
): ProfileRegistryClient => ({
  aoContractClient: aoContractClient,

  // Read
  getProfilesByAddress: async (address: ArweaveId) => {
    const maybeEntries = await aoContractClient.dryrunReadReplyOptionalJson<
      Array<ProfileEntry>
    >(
      {
        tags: [{ name: "Action", value: "Get-Profiles-By-Delegate" }],
        data: JSON.stringify({
          Address: address,
        }),
      } /* Array<ArweaveId> */,
    );
    if (maybeEntries === undefined) {
      return [];
    }
    return maybeEntries;
  },
  getProfilesByAddresses: async (addresses: Array<ArweaveId>) => {
    if (addresses.length === 0) {
      return [];
    }
    const maybeEntries = await aoContractClient.dryrunReadReplyOptionalJson<
      Array<ProfileEntry>
    >(
      {
        tags: [{ name: "Action", value: "Read-Profiles" }],
        data: JSON.stringify({
          Addresses: addresses,
        }),
      } /* Array<ArweaveId> */,
    );
    if (maybeEntries === undefined) {
      return [];
    }
    return maybeEntries;
  },
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
