import { queryClient } from "@/lib/query";
import { VerseClient } from "@/features/verse/contract/verseClient";
import PQueue from "p-queue";
import { fetchUrl } from "@/features/arweave/lib/arweave";
import { VerseState } from "./model";

export function phaserTilesetKey(txId: string) {
  return `Tileset-Primary-${txId}`
}

export function phaserTilemapKey(txId: string) {
  return `Tilemap-${txId}`
}

async function loadVersePhaser(verseClient: VerseClient, phaserLoader: Phaser.Loader.LoaderPlugin) {
  const processQueue = new PQueue({ concurrency: 2 });

  processQueue.add(() => queryClient.ensureQueryData({
    queryKey: ['verseInfo', verseClient.verseId],
    queryFn: async () => verseClient.readInfo(),
  }))
  processQueue.add(async () => {
    // Return the data so we can use it in the next query
    const data = await queryClient.ensureQueryData({
      queryKey: ['verseParameters', verseClient.verseId],
      queryFn: async () => verseClient.readParameters(),
    })

    const _2dParams = data['2D-Tile-0']
    if (_2dParams) {
      // Load the assets using Phaser
      // TODO: Get this to work outside of preload function
      if (_2dParams.Tileset.TxId) {
        phaserLoader.image(phaserTilesetKey(_2dParams.Tileset.TxId), fetchUrl(_2dParams.Tileset.TxId))
      }
      if (_2dParams.Tilemap.TxId) {
        phaserLoader.tilemapTiledJSON(phaserTilemapKey(_2dParams.Tilemap.TxId), fetchUrl(_2dParams.Tilemap.TxId))
      }
    }

    return data;
  })
  processQueue.add(() => queryClient.ensureQueryData({
    queryKey: ['verseEntities', verseClient.verseId],
    queryFn: async () => verseClient.readAllEntities(),
  }))

  await new Promise((resolve) => {
    phaserLoader.on('complete', resolve)
    phaserLoader.start()
  });
  await processQueue.onIdle()
  
  return {
    info: queryClient.getQueryData(['verseInfo', verseClient.verseId]),
    parameters: queryClient.getQueryData(['verseParameters', verseClient.verseId]),
    entities: queryClient.getQueryData(['verseEntities', verseClient.verseId]),
  } as VerseState;
}

export function createLoadVerse(verseClient: VerseClient) {
  return async (loader: Phaser.Loader.LoaderPlugin) => loadVersePhaser(verseClient, loader)
}

export type LoadVerse = ReturnType<typeof createLoadVerse>
