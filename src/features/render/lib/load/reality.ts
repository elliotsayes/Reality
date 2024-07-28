import { queryClient } from "@/lib/query";
import { RealityClient } from "@/features/reality/contract/realityClient";
import PQueue from "p-queue";
import { fetchUrl } from "@/features/arweave/lib/arweave";
import { WorldState } from "./model";
import { ProfileRegistryClient } from "@/features/profile/contract/profileRegistryClient";

export function phaserTilesetKey(txId: string) {
  return `Tileset-Primary-${txId}`;
}

export function phaserTilemapKey(txId: string) {
  return `Tilemap-${txId}`;
}

export async function loadRealityPhaser(
  realityClient: RealityClient,
  profileClient: ProfileRegistryClient,
  phaserLoader: Phaser.Loader.LoaderPlugin,
) {
  const processQueue = new PQueue({ concurrency: 3 });
  const nonce = Date.now().toString();

  processQueue.add(() =>
    queryClient.ensureQueryData({
      queryKey: ["realityInfo", realityClient.worldId],
      queryFn: async () => realityClient.readInfo(),
    }),
  );

  processQueue.add(async () => {
    // Return the data so we can use it in the next query
    const data = await queryClient.ensureQueryData({
      queryKey: ["realityParameters", realityClient.worldId],
      queryFn: async () => realityClient.readParameters(),
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
      queryKey: ["realityEntitiesStatic", realityClient.worldId],
      queryFn: async () => {
        const entitiesStatic = await realityClient.readEntitiesStatic();
        return entitiesStatic;
      },
    });
    const entitiesDynamic = await queryClient.ensureQueryData({
      queryKey: ["realityEntitiesDynamic", realityClient.worldId, nonce],
      queryFn: async () => {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        const entitiesDynamic = await realityClient.readEntitiesDynamic(
          fiveMinsAgo,
          true, // Initial call, to get always-visible entities
        );
        return entitiesDynamic;
      },
    });
    const entitiesAll = { ...entitiesStatic, ...entitiesDynamic };
    console.log("entitiesAll", entitiesAll);

    queryClient.setQueryData(
      ["realityEntities", realityClient.worldId],
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
        "realityEntityProfiles",
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

  const WorldState = {
    info: queryClient.getQueryData(["realityInfo", realityClient.worldId]),
    parameters: queryClient.getQueryData([
      "realityParameters",
      realityClient.worldId,
    ]),
    entities: queryClient.getQueryData([
      "realityEntities",
      realityClient.worldId,
    ]),
    profiles: queryClient.getQueryData([
      "realityEntityProfiles",
      profileClient.aoContractClient.processId,
      profileIds,
    ]),
  } as WorldState;

  return WorldState;
}

export async function loadSpritePhaser(
  phaserLoader: Phaser.Loader.LoaderPlugin,
  key: string,
  url: string,
) {
  return new Promise<void>((resolve) => {
    phaserLoader.spritesheet(key, url, {
      frameWidth: 24,
      frameHeight: 38,
    });
    phaserLoader.on("complete", resolve);
    phaserLoader.start();
  });
}

export function createSpriteAnimsPhaser(
  phaserAnims: Phaser.Animations.AnimationManager,
  keyBase: string,
) {
  phaserAnims.create({
    key: `${keyBase}_idle`,
    frameRate: 6,
    frames: phaserAnims.generateFrameNumbers(keyBase, {
      start: 7,
      end: 10,
    }),
    repeat: -1,
  });

  phaserAnims.create({
    key: `${keyBase}_emote`,
    frameRate: 24,
    frames: phaserAnims.generateFrameNumbers(keyBase, {
      start: 7,
      end: 10,
    }),
    repeat: -1,
  });

  phaserAnims.create({
    key: `${keyBase}_walk`,
    frameRate: 12,
    frames: phaserAnims.generateFrameNumbers(keyBase, {
      start: 14,
      end: 17,
    }),
    repeat: -1,
  });

  phaserAnims.create({
    key: `${keyBase}_dance`,
    frameRate: 24,
    frames: phaserAnims.generateFrameNumbers(keyBase, {
      start: 14,
      end: 17,
    }),
    repeat: 3,
  });
}
