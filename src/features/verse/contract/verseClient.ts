import { ArweaveId } from "@/features/arweave/lib/model";
import { MessageId } from "../../ao/lib/aoClient";
import { AoContractClient, createAoContractClient } from "../../ao/lib/aoContractClient";
import { VerseEntities, VerseEntity, VerseEntityCreate, VerseEntityPosition, VerseInfo, VerseParameters } from "./model";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";

export type VerseClient = {
  aoContractClient: AoContractClient;

  verseId: string;

  // Reads
  readInfo(): Promise<VerseInfo>;
  readParameters(): Promise<VerseParameters>;
  readAllEntities(): Promise<VerseEntities>;
  readEntities(entityIds: Array<ArweaveId>): Promise<VerseEntities>;

  // Writes
  createEntity(entity: VerseEntity): Promise<MessageId>;
  updateEntityPosition(position: VerseEntityPosition): Promise<MessageId>;
}

export const createVerseClient = (
  aoContractClient: AoContractClient,
): VerseClient => ({
  aoContractClient: aoContractClient,

  verseId: aoContractClient.processId,

  // Read
  readInfo: () => aoContractClient.dryrunReadReplyOneJson<VerseInfo>({
    tags: [{ name: "Action", value: "VerseInfo" }]
  }, /* VerseInfo */),
  readParameters: () => aoContractClient.dryrunReadReplyOneJson<VerseParameters>({
    tags: [{ name: "Action", value: "VerseParameters" }]
  }, /* VerseParameters */), // TODO: Define VerseParameters properly
  readAllEntities: () => aoContractClient.dryrunReadReplyOneJson<VerseEntities>({
    tags: [{ name: "Action", value: "VerseEntities" }]
  }, /* VerseEntities */), // TODO: Define VerseEntities properly
  readEntities: (entityIds: Array<ArweaveId>) => aoContractClient.dryrunReadReplyOneJson<VerseEntities>({
    tags: [{ name: "Action", value: "VerseParameters" }],
    data: JSON.stringify({ EntityIds: entityIds }),
  }, /* VerseEntities */), // TODO: Define VerseEntities properly

  // Write
  createEntity: (entity: VerseEntityCreate) => aoContractClient.message({
    tags: [{ name: "Action", value: "VerseEntityCreate" }],
    data: JSON.stringify(entity),
  }),
  updateEntityPosition: (position: VerseEntityPosition) => aoContractClient.message({
    tags: [{ name: "Action", value: "VerseEntityUpdatePosition" }],
    data: JSON.stringify({ Position: position }),
  }),
});

export type VerseClientForProcess = (processId: string) => VerseClient;

export const createVerseClientForProcess = (wallet: AoWallet): VerseClientForProcess => (processId: string) => {
  const aoContractClient = createAoContractClient(processId, connect(), wallet);
  return createVerseClient(aoContractClient);
}
