import { MessageId } from "../../ao/lib/aoClient";
import { AoContractClient } from "../../ao/lib/aoContractClient";

export type WeaveWorldClient = {
  aoContractClient: AoContractClient;

  // Reads
  readInfo(): Promise<WeaveWorldInfo>;
  readParameters(): Promise<WeaveWorldParameters>;
  readAllEntities(): Promise<WeaveWorldEntity[]>;
  readEntity(entityId: string): Promise<WeaveWorldEntity>;

  // Writes
  writePosition(position: WeaveWorldPosition): Promise<MessageId>;
}

export const createWeaveWorldClient = (
  aoContractClient: AoContractClient,
) => {
  const weaveWorldClient: WeaveWorldClient = {
    aoContractClient: aoContractClient,

    readInfo: () => aoContractClient.dryrunReadReplyOneJson<WeaveWorldInfo>({
      tags: [{ name: "Action", value: "WorldInfo" }]
    }),
    readParameters: () => aoContractClient.dryrunReadReplyOneJson<WeaveWorldParameters>({
      tags: [{ name: "Action", value: "WorldParameters" }]
    }),
    readAllEntities: () => aoContractClient.dryrunReadReplyOneJson<WeaveWorldEntity[]>({
      tags: [{ name: "Action", value: "WorldEntities" }]
    }),
    readEntity: (entityId: string) => aoContractClient.dryrunReadReplyOneJson<WeaveWorldEntity>({
      tags: [
        { name: "Action", value: "WorldParameters" },
        { name: "EntityId", value: entityId },
      ]
    }),
    writePosition: (position: WeaveWorldPosition) => aoContractClient.message({
      tags: [{ name: "Action", value: "WorldUpdatePosition" }],
      data: JSON.stringify(position),
    }),
  }

  return weaveWorldClient;
}