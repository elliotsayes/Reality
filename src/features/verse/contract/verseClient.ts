import { MessageId } from "../../ao/lib/aoClient";
import {
  AoContractClient,
  createAoContractClient,
} from "../../ao/lib/aoContractClient";
import {
  VerseEntities,
  VerseEntity,
  VerseEntityCreate,
  VerseEntityPosition,
  VerseInfo,
  VerseParameters,
} from "./model";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";

export type VerseClient = {
  aoContractClient: AoContractClient;

  verseId: string;

  // Reads
  readInfo(): Promise<VerseInfo>;
  readParameters(): Promise<VerseParameters>;
  readEntitiesStatic(): Promise<VerseEntities>;
  readEntitiesDynamic(
    sinceTime: Date,
    isInitial?: boolean,
  ): Promise<VerseEntities>;

  // Writes
  createEntity(entity: VerseEntity): Promise<MessageId>;
  updateEntityPosition(position: VerseEntityPosition): Promise<MessageId>;
  hideEntity(): Promise<MessageId>;
};

export const createVerseClient = (
  aoContractClient: AoContractClient,
): VerseClient => ({
  aoContractClient: aoContractClient,

  verseId: aoContractClient.processId,

  // Read
  readInfo: () =>
    aoContractClient.dryrunReadReplyOneJson<VerseInfo>(
      {
        tags: [{ name: "Action", value: "VerseInfo" }],
      } /* VerseInfo */,
    ),
  readParameters: () =>
    aoContractClient.dryrunReadReplyOneJson<VerseParameters>(
      {
        tags: [{ name: "Action", value: "VerseParameters" }],
      } /* VerseParameters */,
    ), // TODO: Define VerseParameters properly
  readEntitiesStatic: () =>
    aoContractClient.dryrunReadReplyOneJson<VerseEntities>(
      {
        tags: [{ name: "Action", value: "VerseEntitiesStatic" }],
      } /* VerseEntities */,
    ), // TODO: Define VerseEntities properly
  readEntitiesDynamic: (sinceTime: Date, isInitial = false) =>
    aoContractClient.dryrunReadReplyOneJson<VerseEntities>(
      {
        tags: [{ name: "Action", value: "VerseEntitiesDynamic" }],
        data: JSON.stringify({
          Timestamp: Math.floor(sinceTime.getTime()),
          Initial: isInitial,
        }),
      } /* VerseEntities */,
    ), // TODO: Define VerseEntities properly

  // Write
  createEntity: (entity: VerseEntityCreate) =>
    aoContractClient.message({
      tags: [{ name: "Action", value: "VerseEntityCreate" }],
      data: JSON.stringify(entity),
    }),
  updateEntityPosition: (position: VerseEntityPosition) =>
    aoContractClient.message({
      tags: [{ name: "Action", value: "VerseEntityUpdatePosition" }],
      data: JSON.stringify({ Position: position }),
    }),
  hideEntity: () =>
    aoContractClient.message({
      tags: [{ name: "Action", value: "VerseEntityHide" }],
    }),
});

export type VerseClientForProcess = (processId: string) => VerseClient;

export const createVerseClientForProcess =
  (wallet: AoWallet): VerseClientForProcess =>
  (processId: string) => {
    const aoContractClient = createAoContractClient(
      processId,
      connect(),
      wallet,
    );
    return createVerseClient(aoContractClient);
  };
