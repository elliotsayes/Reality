import { queryClient } from "@/lib/query";
import { VerseClient } from "@/features/verse/contract/verseClient";
import PQueue from "p-queue";
import { fetchUrl } from "@/features/arweave/lib/arweave";
import { VerseState } from "./model";
import { ProfileClient } from "@/features/profile/contract/profileClient";

export function phaserTilesetKey(txId: string) {
  return `Tileset-Primary-${txId}`;
}

export function phaserTilemapKey(txId: string) {
  return `Tilemap-${txId}`;
}

export async function loadVersePhaser(
  verseClient: VerseClient,
  profileClient: ProfileClient,
  phaserLoader: Phaser.Loader.LoaderPlugin,
) {
  const processQueue = new PQueue({ concurrency: 3 });

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
  processQueue.add(async () => {
    const entities = await queryClient.ensureQueryData({
      queryKey: ["verseEntities", verseClient.verseId],
      queryFn: async () => {
        const entitiesStatic = await verseClient.readEntitiesStatic();
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        const entitiesDynamic =
          await verseClient.readEntitiesDynamic(fiveMinsAgo);
        return { ...entitiesStatic, ...entitiesDynamic };
      },
    });

    const profileEntites = Object.keys(entities).filter((entityId) => {
      const entity = entities[entityId];
      return entity.Type === "Avatar";
    });

    await queryClient.ensureQueryData({
      queryKey: [
        "verseEntityProfiles",
        profileClient.aoContractClient.processId,
        verseClient.verseId,
      ],
      queryFn: async () => profileClient.readProfiles(profileEntites),
    });
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
      verseClient.verseId,
    ]),
  } as VerseState;

  return verseState;
}
