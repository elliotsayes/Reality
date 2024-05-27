import { ArweaveId } from "@/features/arweave/lib/model";
import { MessageId } from "../../ao/lib/aoClient";
import { AoContractClient } from "../../ao/lib/aoContractClient";
import { VerseEntities, VerseEntityPosition, VerseInfo, VerseParameters } from "./model";

export type VerseClient = {
  aoContractClient: AoContractClient;

  // Reads
  readInfo(): Promise<VerseInfo>;
  readParameters(): Promise<VerseParameters>;
  readAllEntities(): Promise<VerseEntities>;
  readEntities(entityIds: Array<ArweaveId>): Promise<VerseEntities>;

  // Writes
  writePosition(position: VerseEntityPosition): Promise<MessageId>;
}

export const createVerseClient = (
  aoContractClient: AoContractClient,
): VerseClient => ({
  aoContractClient: aoContractClient,

  // Read
  readInfo: () => aoContractClient.dryrunReadReplyOneJson<VerseInfo>({
    tags: [{ name: "Action", value: "VerseInfo" }]
  }, VerseInfo),
  readParameters: () => aoContractClient.dryrunReadReplyOneJson<VerseParameters>({
    tags: [{ name: "Action", value: "VerseParameters" }]
  }, VerseParameters),
  readAllEntities: () => aoContractClient.dryrunReadReplyOneJson<VerseEntities>({
    tags: [{ name: "Action", value: "VerseEntities" }]
  }, VerseEntities),
  readEntities: (entityIds: Array<ArweaveId>) => aoContractClient.dryrunReadReplyOneJson<VerseEntities>({
    tags: [{ name: "Action", value: "VerseParameters" }],
    data: JSON.stringify({
      EntityIds: entityIds,
    }),
  }, VerseEntities),

  // Write
  writePosition: (position: VerseEntityPosition) => aoContractClient.message({
    tags: [{ name: "Action", value: "VerseUpdatePosition" }],
    data: JSON.stringify(position),
  }),
});