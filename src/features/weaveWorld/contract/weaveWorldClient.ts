import { ArweaveId } from "@/features/arweave/lib/model";
import { MessageId } from "../../ao/lib/aoClient";
import { AoContractClient } from "../../ao/lib/aoContractClient";
import { WorldEntities, WorldEntityPosition, WorldInfo, WorldParameters } from "./model";

export type WeaveWorldClient = {
  aoContractClient: AoContractClient;

  // Reads
  readInfo(): Promise<WorldInfo>;
  readParameters(): Promise<WorldParameters>;
  readAllEntities(): Promise<WorldEntities>;
  readEntities(entityIds: Array<ArweaveId>): Promise<WorldEntities>;

  // Writes
  writePosition(position: WorldEntityPosition): Promise<MessageId>;
}

export const createWeaveWorldClient = (
  aoContractClient: AoContractClient,
) => {
  const weaveWorldClient: WeaveWorldClient = {
    aoContractClient: aoContractClient,

    // Read
    readInfo: () => aoContractClient.dryrunReadReplyOneJson<WorldInfo>({
      tags: [{ name: "Action", value: "WorldInfo" }]
    }, WorldInfo),
    readParameters: () => aoContractClient.dryrunReadReplyOneJson<WorldParameters>({
      tags: [{ name: "Action", value: "WorldParameters" }]
    }, WorldParameters),
    readAllEntities: () => aoContractClient.dryrunReadReplyOneJson<WorldEntities>({
      tags: [{ name: "Action", value: "WorldEntities" }]
    }, WorldEntities),
    readEntities: (entityIds: Array<ArweaveId>) => aoContractClient.dryrunReadReplyOneJson<WorldEntities>({
      tags: [{ name: "Action", value: "WorldParameters" }],
      data: JSON.stringify({
        EntityIds: entityIds,
      }),
    }, WorldEntities),

    // Write
    writePosition: (position: WorldEntityPosition) => aoContractClient.message({
      tags: [{ name: "Action", value: "WorldUpdatePosition" }],
      data: JSON.stringify(position),
    }),
  }

  return weaveWorldClient;
}