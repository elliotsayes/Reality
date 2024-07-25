import { MessageId } from "../../ao/lib/aoClient";
import {
  AoContractClient,
  createAoContractClient,
} from "../../ao/lib/aoContractClient";
import {
  RealityEntities,
  RealityEntity,
  RealityEntityCreate,
  RealityEntityPosition,
  RealityInfo,
  RealityParameters,
} from "./model";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";

export type RealityClient = {
  aoContractClient: AoContractClient;

  worldId: string;

  // Reads
  readInfo(): Promise<RealityInfo>;
  readParameters(): Promise<RealityParameters>;
  readEntitiesStatic(): Promise<RealityEntities>;
  readEntitiesDynamic(
    sinceTime: Date,
    isInitial?: boolean,
  ): Promise<RealityEntities>;

  // Writes
  createEntity(entity: RealityEntity): Promise<MessageId>;
  updateEntityPosition(position: RealityEntityPosition): Promise<MessageId>;
  hideEntity(): Promise<MessageId>;
};

export const createRealityClient = (
  aoContractClient: AoContractClient,
): RealityClient => ({
  aoContractClient: aoContractClient,

  worldId: aoContractClient.processId,

  // Read
  readInfo: () =>
    aoContractClient.dryrunReadReplyOneJson<RealityInfo>(
      {
        tags: [{ name: "Action", value: "Reality.Info" }],
      } /* RealityInfo */,
    ),
  readParameters: () =>
    aoContractClient.dryrunReadReplyOneJson<RealityParameters>(
      {
        tags: [{ name: "Action", value: "Reality.Parameters" }],
      } /* RealityParameters */,
    ), // TODO: Define RealityParameters properly
  readEntitiesStatic: () =>
    aoContractClient.dryrunReadReplyOneJson<RealityEntities>(
      {
        tags: [{ name: "Action", value: "Reality.EntitiesStatic" }],
      } /* RealityEntities */,
    ), // TODO: Define RealityEntities properly
  readEntitiesDynamic: (sinceTime: Date, isInitial = false) =>
    aoContractClient.dryrunReadReplyOneJson<RealityEntities>(
      {
        tags: [{ name: "Action", value: "Reality.EntitiesDynamic" }],
        data: JSON.stringify({
          Timestamp: Math.floor(sinceTime.getTime()),
          Initial: isInitial,
        }),
      } /* RealityEntities */,
    ), // TODO: Define RealityEntities properly

  // Write
  createEntity: (entity: RealityEntityCreate) =>
    aoContractClient.message({
      tags: [{ name: "Action", value: "Reality.EntityCreate" }],
      data: JSON.stringify(entity),
    }),
  updateEntityPosition: (position: RealityEntityPosition) =>
    aoContractClient.message({
      tags: [{ name: "Action", value: "Reality.EntityUpdatePosition" }],
      data: JSON.stringify({ Position: position }),
    }),
  hideEntity: () =>
    aoContractClient.message({
      tags: [{ name: "Action", value: "Reality.EntityHide" }],
    }),
});

export type RealityClientForProcess = (processId: string) => RealityClient;

export const createRealityClientForProcess =
  (wallet: AoWallet): RealityClientForProcess =>
  (processId: string) => {
    const aoContractClient = createAoContractClient(
      processId,
      connect(),
      wallet,
    );
    return createRealityClient(aoContractClient);
  };
