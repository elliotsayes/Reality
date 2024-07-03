import { queryClient } from "@/lib/query";
import { VerseClient } from "@/features/verse/contract/verseClient";
import PQueue from "p-queue";
import { fetchUrl } from "@/features/arweave/lib/arweave";
import { VerseState } from "./model";
import { ProfileRegistryClient } from "@/features/profile/contract/profileRegistryClient";

export function phaserTilesetKey(txId: string) {
  return `Tileset-Primary-${txId}`;
}

export function phaserTilemapKey(txId: string) {
  return `Tilemap-${txId}`;
}

export async function loadVersePhaser(
  verseClient: VerseClient,
  profileClient: ProfileRegistryClient,
  phaserLoader: Phaser.Loader.LoaderPlugin,
) {
  const processQueue = new PQueue({ concurrency: 3 });
  const nonce = Date.now().toString();

  processQueue.add(() =>
    queryClient.ensureQueryData({
      queryKey: ["verseInfo", verseClient.verseId],
      queryFn: async () => verseClient.readInfo(),
    }),
  );

  processQueue.add(async () => {
    // Return the data so we can use it in the next query
    const data = await queryClient.ensureQueryData({
      queryKey: ["verseParameters", verseClient.verseId],
      queryFn: async () => verseClient.readParameters(),
    });

    const _2dParams = data["2D-Tile-0"];
    if (_2dParams) {
      // Load the assets using Phaser
      // TODO: Get this to work outside of preload function
      if (_2dParams.Tileset.TxId) {
        phaserLoader.image(
          phaserTilesetKey(_2dParams.Tileset.TxId),
          fetchUrl(_2dParams.Tileset.TxId),
        );
      }
      if (_2dParams.Tilemap.TxId) {
        phaserLoader.tilemapTiledJSON(
          phaserTilemapKey(_2dParams.Tilemap.TxId),
          fetchUrl(_2dParams.Tilemap.TxId),
        );
      }
    }

    return data;
  });

  let profileIds: Array<string> | undefined;
  processQueue.add(async () => {
    const entitiesStatic = await queryClient.ensureQueryData({
      queryKey: ["verseEntitiesStatic", verseClient.verseId],
      queryFn: async () => {
        const entitiesStatic = await verseClient.readEntitiesStatic();
        return entitiesStatic;
      },
    });
    const entitiesDynamic = await queryClient.ensureQueryData({
      queryKey: ["verseEntitiesDynamic", verseClient.verseId, nonce],
      queryFn: async () => {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        const entitiesDynamic =
          await verseClient.readEntitiesDynamic(fiveMinsAgo);
        return entitiesDynamic;
      },
    });
    const entitiesAll = { ...entitiesStatic, ...entitiesDynamic };
    console.log("entitiesAll", entitiesAll);

    queryClient.setQueryData(
      ["verseEntities", verseClient.verseId],
      entitiesAll,
    );

    profileIds = Array.from(
      Object.values(entitiesAll)
        .filter((entity) => {
          return entity.Type === "Avatar";
        })
        .reduce((acc, entity) => {
          if (entity.Metadata?.ProfileId) {
            acc.add(entity.Metadata.ProfileId);
          }
          return acc;
        }, new Set<string>()),
    );
    console.log("ProfileIds", profileIds);

    const profiles = await queryClient.ensureQueryData({
      queryKey: [
        "verseEntityProfiles",
        profileClient.aoContractClient.processId,
        profileIds,
      ],
      queryFn: async () => profileClient.readProfiles(profileIds ?? []),
    });
    console.log("Profiles", profiles);
  });

  await processQueue.onIdle();
  await new Promise((resolve) => {
    phaserLoader.on("complete", resolve);
    phaserLoader.start();
  });

  const verseState = {
    info: queryClient.getQueryData(["verseInfo", verseClient.verseId]),
    parameters: queryClient.getQueryData([
      "verseParameters",
      verseClient.verseId,
    ]),
    entities: queryClient.getQueryData(["verseEntities", verseClient.verseId]),
    profiles: queryClient.getQueryData([
      "verseEntityProfiles",
      profileClient.aoContractClient.processId,
      profileIds,
    ]),
  } as VerseState;

  return verseState;
}
