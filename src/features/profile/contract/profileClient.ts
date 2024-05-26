import { ArweaveId } from "@/features/arweave/lib/model";
import { MessageId } from "../../ao/lib/aoClient";
import { AoContractClient } from "../../ao/lib/aoContractClient";
import { ProfileInfo, ProfileInfoWritable } from "./model";

export type ProfileClient = {
  aoContractClient: AoContractClient;

  // Reads
  readProfile(profileId: ArweaveId): Promise<ProfileInfo>;

  // Writes
  writeProfile(profile: ProfileInfoWritable): Promise<MessageId>;
}

// Placeholder
// TODO: Define these methods properly
export const createProfileClient = (
  aoContractClient: AoContractClient,
) => ({
  aoContractClient: aoContractClient,

  // Read
  readProfile: (profileId: string) => aoContractClient.dryrunReadReplyOneJson<ProfileInfo>({
    tags: [
      { name: "Action", value: "ProfileGet" },
      { name: "ProfileId", value: profileId }
    ],
  }, ProfileInfo),

  // Write
  writeProfile: (profile: ProfileInfoWritable) => aoContractClient.message({
    tags: [{ name: "Action", value: "ProfileUpdate" }],
    data: JSON.stringify(profile),
  }),
});
