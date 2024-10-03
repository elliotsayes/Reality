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
    const data = await queryClient.fetchQuery({
      queryKey: ["realityParameters", realityClient.worldId],
      queryFn: async () => realityClient.readParameters(),
      staleTime: 1,
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

    const audioParams = data["Audio-0"];
    console.log("audioParams", audioParams);
    if (audioParams?.Bgm?.TxId) {
      phaserLoader.audio(`audio_${audioParams.Bgm.TxId}`, {
        type: audioParams.Bgm.Format.toLowerCase(),
        url: fetchUrl(audioParams.Bgm.TxId),
      });
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
  sprite: { image: string; atlas?: string },
) {
  const atlas =
    sprite.atlas !== undefined
      ? await fetch(fetchUrl(sprite.atlas!)).then((res) => res.json() as object)
      : undefined;
  return new Promise<{ atlas: object | undefined }>((resolve) => {
    phaserLoader.image(`sprite_${sprite.image}`, fetchUrl(sprite.image));
    phaserLoader.on("complete", () => resolve({ atlas }));
    phaserLoader.start();
  });
}

export function getSystemAniNames() {
  const systemAnis = ["idle", "emote", "dance"];

  for (const xdir of [undefined, "side"]) {
    const xdirStr = xdir ? `_${xdir}` : "";
    systemAnis.push(`walk${xdirStr}`);
    for (const ydir of ["up", "down"]) {
      systemAnis.push(`walk${xdirStr}_${ydir}`);
    }
  }

  return systemAnis;
}

export function resolveSystemAniToExistingAni(
  systemAni: string,
  aniNames: string[],
) {
  if (!aniNames.find((x) => x === "idle"))
    throw new Error(`No idle animation found in ${aniNames}`);

  if (systemAni.startsWith("walk_side_")) {
    if (aniNames.find((x) => x === systemAni)) return systemAni;
    if (aniNames.find((x) => x === "walk_side")) return "walk_side";
  }

  if (systemAni.startsWith("walk_")) {
    if (aniNames.find((x) => x === systemAni)) return systemAni;
    if (aniNames.find((x) => x === "walk")) return "walk";
  }

  if (aniNames.find((x) => x === systemAni)) return systemAni;

  return "idle";
}

export function createSpriteAnimsPhaser(
  phaserTextures: Phaser.Textures.TextureManager,
  phaserAnims: Phaser.Animations.AnimationManager,
  keyBase: string,
  atlas: object | object[],
) {
  const textureImage = phaserTextures.get(keyBase);
  const textureAtlas = phaserTextures.addAtlas(keyBase, textureImage, atlas)!;
  const anis: Record<string, string[]> = textureAtlas.customData["animations"];
  const aniNames = Object.keys(anis);

  const systemAnis = getSystemAniNames();
  const mappedSystemAnis = systemAnis.map(
    (aniName) => ({
      aniName: aniName,
      resolvedAni: resolveSystemAniToExistingAni(aniName, aniNames),
    }),
    anis,
  );

  const mappedCustomAnis = Object.keys(anis)
    .filter((aniName) => !systemAnis.includes(aniName))
    .map((aniName) => ({
      aniName,
      resolvedAni: aniName,
    }));

  const mappedAnis = [...mappedSystemAnis, ...mappedCustomAnis];

  for (const mappedAni of mappedAnis) {
    phaserAnims.create({
      key: `${keyBase}_${mappedAni.aniName}`,
      frames: phaserAnims.generateFrameNames(keyBase, {
        start: 0,
        end: anis[mappedAni.resolvedAni].length - 1,
        prefix: `${mappedAni.resolvedAni}_`,
        zeroPad: 2,
        suffix: ".png",
      }),
      repeat: -1,
      frameRate: 10,
    });
  }
}
