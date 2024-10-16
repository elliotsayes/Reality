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
    phaserLoader.image(
      `sprite_${sprite.image}_${sprite.atlas ?? "default"}`,
      fetchUrl(sprite.image),
    );
    phaserLoader.on("complete", () => resolve({ atlas }));
    phaserLoader.start();
  });
}

export function getDirectionFromDelta(dx: number, dy: number) {
  // Calculate the angle in radians
  const angle = Math.atan2(dy, dx);

  // Convert the angle from radians to degrees
  let degrees = angle * (180 / Math.PI);

  // Normalize the angle to be within [0, 360)
  if (degrees < 0) {
    degrees += 360;
  }

  // Define the 8 directions
  const directions = [
    "right", // 0 degrees
    "down_right", // 45 degrees
    "down", // 90 degrees
    "down_left", // 135 degrees
    "left", // 180 degrees
    "up_left", // 225 degrees
    "up", // 270 degrees
    "up_right", // 315 degrees
  ];

  // Determine the index of the closest direction (each direction covers 45 degrees)
  const index = Math.round(degrees / 45) % 8;

  // Return the corresponding direction
  return directions[index];
}

export function getSystemAniNames() {
  const systemAnis = ["emote", "dance"];

  for (const base of ["idle", "walk"]) {
    for (const ydir of [undefined, "up", "down"]) {
      const ydirStr = ydir ? `_${ydir}` : "";
      for (const xdir of [undefined, "left", "right"]) {
        const xdirStr = xdir ? `_${xdir}` : "";
        systemAnis.push(`${base}${xdirStr}${ydirStr}`);
      }
    }
  }

  return systemAnis;
}

export function resolveSystemAniToExistingAni(
  systemAni: string,
  aniExists: (ani: string) => boolean,
): string {
  if (aniExists(systemAni)) return systemAni;

  const components = systemAni.split("_");

  if (components.length === 1) {
    if (components[0] === "run")
      return resolveSystemAniToExistingAni("walk", aniExists);
    if (!aniExists("idle")) throw Error("No idle animation found");
    return "idle";
  } else if (components.length === 2) {
    return resolveSystemAniToExistingAni(components[0], aniExists);
  } /* if (components.length === 3) */ else {
    return resolveSystemAniToExistingAni(
      `${components[0]}_${components[1]}`,
      aniExists,
    );
  }
}

type AtlasAnimations = Record<
  string,
  {
    key: string;
    frames: Phaser.Types.Animations.AnimationFrame[];
  }
>;

function getAtlasAnimations(
  keyBase: string,
  atlas: object | object[],
): AtlasAnimations {
  const frames = atlas["frames"];
  const anis: AtlasAnimations = {};

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const fileName = frame["filename"];
    const fileNameExtensionless = fileName.split(".")[0];
    const filenameParts = fileNameExtensionless.split("_");
    const animationName = filenameParts.slice(0, -1).join("_");

    if (!anis[animationName]) {
      anis[animationName] = {
        key: `${keyBase}_${animationName}`,
        frames: [],
      };
    }
    anis[animationName].frames.push({
      key: keyBase,
      frame: fileName,
    });
  }
  return anis;
}

export function createSpriteAnimsPhaser(
  phaserTextures: Phaser.Textures.TextureManager,
  phaserAnims: Phaser.Animations.AnimationManager,
  spriteKeyBase: string,
  atlas: object | object[],
) {
  const textureImage = phaserTextures.get(spriteKeyBase);
  // console.log({ textureImage });
  if (textureImage.frameTotal > 1) {
    // console.log("Animations already exist for", spriteKeyBase);
    return;
  }

  const atlasKey = `atlas_${spriteKeyBase}`;
  phaserTextures.addAtlas(atlasKey, textureImage, atlas)!;

  const animations = getAtlasAnimations(spriteKeyBase, atlas);

  for (const [name, animation] of Object.entries(animations)) {
    const aniMeta = atlas["meta"]?.["animations"]?.[name];
    phaserAnims.create({
      key: animation.key,
      frames: animation.frames,
      repeat: -1,
      frameRate: aniMeta?.fps ?? 8,
    });
  }
}
