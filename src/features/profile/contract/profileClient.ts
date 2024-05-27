import { ArweaveId } from "@/features/arweave/lib/model";
import { MessageId } from "../../ao/lib/aoClient";
import { AoContractClient } from "../../ao/lib/aoContractClient";
import { ProfileInfo, ProfileInfoWritable } from "./model";

export type ProfileClient = {
  aoContractClient: AoContractClient;

  // Reads
  readProfiles(profileIds: Array<ArweaveId>): Promise<ProfileInfo>;

  // Writes
  writeProfile(profile: ProfileInfoWritable): Promise<MessageId>;
}

// Placeholder
// TODO: Define these methods properly
export const createProfileClient = (
  aoContractClient: AoContractClient,
): ProfileClient => ({
  aoContractClient: aoContractClient,

  // Read
  readProfiles: (profileIds: Array<ArweaveId>) => aoContractClient.dryrunReadReplyOneJson<ProfileInfo>({
    tags: [{ name: "Action", value: "ProfileGet" }],
    data: JSON.stringify({
      ProfileIds: profileIds,
    }),
  }, ProfileInfo),

  // Write
  writeProfile: (profile: ProfileInfoWritable) => aoContractClient.message({
    tags: [{ name: "Action", value: "ProfileUpdate" }],
    data: JSON.stringify(profile),
  }),
});
