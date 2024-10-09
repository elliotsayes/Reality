import { WarpableScene } from "./WarpableScene";
import { WorldState } from "../../load/model";
import {
  getDirectionFromDelta,
  phaserTilemapKey,
  phaserTilesetKey,
  resolveSystemAniToExistingAni,
} from "../../load/reality";
import { _2dTileParams } from "@/features/reality/contract/_2dTile";
import { emitSceneReady, emitSceneEvent } from "../../EventBus";
import {
  RealityEntity,
  RealityEntityKeyed,
} from "@/features/reality/contract/model";
import ReactDOM from "react-dom/client";
import { BoxCentered, Point2D, Size2D, WarpTarget } from "../../model";
import { FormOverlay } from "@/features/render/components/FormOverlay";
import { AoContractClientForProcess } from "@/features/ao/lib/aoContractClient";
import { isDebug } from "../game";
import { truncateAddress } from "@/features/arweave/lib/utils";
import { ProfileInfo } from "@/features/profile/contract/model";
import { ChatMessageHistory } from "@/features/chat/contract/model";
import TutorialOverlay from "@/features/render/components/TutorialOverlay";
import { AudioParams } from "@/features/reality/contract/audio";

const SCALE_TILES = 3;
const SCALE_ENTITIES = 2;

const DEFAULT_TILE_SIZE_ORIGINAL = 16;
const DEFAULT_TILE_SIZE_SCALED = DEFAULT_TILE_SIZE_ORIGINAL * SCALE_TILES;

const DEPTH_BG_BASE = -200; // => -101
const DEPTH_FG_BASE = 100; // => 199
const DEPTH_ENTITY_BASE = -100; // => -1
const DEPTH_PLAYER_BASE = 0; // => 400

const DEPTH_TEXT_BASE = 500;

const OBJECT_SIZE_ENTITY = 2;

const bouncerEntityIds = ["Bouncer1", "Bouncer2"];

export class WorldScene extends WarpableScene {
  playerAddress!: string;
  playerProfileInfo?: ProfileInfo;

  warpTarget!: WarpTarget;
  worldId!: string;
  worldState!: WorldState;
  aoContractClientForProcess!: AoContractClientForProcess;

  _2dTileParams?: _2dTileParams;
  tilesetTxId?: string;
  tilemapTxId?: string;

  audioParams?: AudioParams;
  bgm?: Phaser.Sound.BaseSound;

  tileSizeScaled: [number, number] = [
    DEFAULT_TILE_SIZE_SCALED,
    DEFAULT_TILE_SIZE_SCALED,
  ];
  spawnPixel: [number, number] = [0, 0];

  loadText!: Phaser.GameObjects.Text;

  camera!: Phaser.Cameras.Scene2D.Camera;

  tilemap?: Phaser.Tilemaps.Tilemap;
  layers?: Phaser.Tilemaps.TilemapLayer[];

  playerSpriteKeyBase!: string;
  player!: Phaser.GameObjects.Container;

  arrows?: object;
  wasd?: object;

  lastTickMoving: boolean = false;
  lastTickDirection: string = "down";

  isWarping: boolean = false;

  avatarEntityContainers: Record<string, Phaser.GameObjects.Container> = {};
  warpSprites: Record<string, Phaser.Physics.Arcade.Sprite> = {};
  warpLabels: Record<string, Phaser.GameObjects.Text> = {};
  entityTargets: Record<string, Phaser.Physics.Arcade.Sprite> = {};

  activeEntityEvent?: Phaser.GameObjects.GameObject;

  tutorial?: Phaser.GameObjects.DOMElement;
  schemaForm?: Phaser.GameObjects.DOMElement;

  slowMs: number = 144;
  fastMs: number = 144;
  // fastMs: number = 192;

  constructor() {
    super("WorldScene");
  }

  init({
    playerAddress,
    playerProfileInfo,
    warpTarget,
    reality,
    aoContractClientForProcess,
  }: {
    playerAddress: string;
    playerProfileInfo?: ProfileInfo;
    warpTarget: WarpTarget;
    reality: WorldState;
    aoContractClientForProcess: AoContractClientForProcess;
  }) {
    // reset some vars
    this.isWarping = false;
    this.activeEntityEvent = undefined;
    this.layers = undefined;
    this.slowMs = 120;

    this.playerAddress = playerAddress;
    this.playerProfileInfo = playerProfileInfo;

    this.warpTarget = warpTarget;
    this.worldId = warpTarget.worldId;
    this.worldState = reality;
    this.aoContractClientForProcess = aoContractClientForProcess;

    this._2dTileParams = this.worldState.parameters["2D-Tile-0"];
    this.audioParams = this.worldState.parameters["Audio-0"];

    this.tilesetTxId = this._2dTileParams?.Tileset.TxId;
    this.tilemapTxId = this._2dTileParams?.Tilemap.TxId;
    this.inputEnable();

    this.pixelateIn();
  }

  inputEnable() {
    const keyboard = this.input.keyboard;
    if (keyboard) {
      console.log("inputEnable: Keyboard found");
      keyboard.manager.enabled = true;
      this.arrows = keyboard.addKeys(
        {
          left: Phaser.Input.Keyboard.KeyCodes.LEFT,
          right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
          up: Phaser.Input.Keyboard.KeyCodes.UP,
          down: Phaser.Input.Keyboard.KeyCodes.DOWN,
        },
        false,
      );
      this.wasd = keyboard.addKeys(
        {
          // left: Phaser.Input.Keyboard.KeyCodes.A,
          // right: Phaser.Input.Keyboard.KeyCodes.D,
          // up: Phaser.Input.Keyboard.KeyCodes.W,
          // down: Phaser.Input.Keyboard.KeyCodes.S,
        },
        false,
      );
    } else {
      console.warn("inputEnable: No keyboard found");
    }
  }

  inputDisable() {
    const keyboard = this.input.keyboard;
    if (keyboard) {
      console.log("inputDisable: Keyboard found");
      keyboard.manager.enabled = false;
    } else {
      console.warn("inputDisable: No keyboard found");
    }
  }

  topLeftInitial() {
    const cameraCenter = {
      x: this.spawnPixel[0],
      y: this.spawnPixel[1],
    };
    const cameraSize = {
      w: this.camera.width,
      h: this.camera.height,
    };

    return {
      x: cameraCenter.x - cameraSize.w / 2,
      y: cameraCenter.y - cameraSize.h / 2,
    };
  }

  topLeftDynamic() {
    return {
      x: this.camera.worldView.x,
      y: this.camera.worldView.y,
    };
  }

  preload() {}

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x111111);

    if (this.tilesetTxId && this.tilemapTxId) {
      console.log(
        `[${this.worldState.info.Name}] Loading tilemap ${this.tilemapTxId} and tileset ${this.tilesetTxId}`,
      );

      this.tilemap = this.make.tilemap({
        key: phaserTilemapKey(this.tilemapTxId),
      });
      const tileset = this.tilemap.addTilesetImage(
        "Primary",
        phaserTilesetKey(this.tilesetTxId),
      )!;

      this.tileSizeScaled = [
        this.tilemap.tileWidth * SCALE_TILES,
        this.tilemap.tileHeight * SCALE_TILES,
      ];

      const mapOffsetTiles = this.worldState.parameters["2D-Tile-0"]?.Tilemap
        .Offset ?? [0, 0];
      // Center the tiles around the origins
      const mapOffsetPixels = [
        mapOffsetTiles[0] * this.tileSizeScaled[0] - this.tileSizeScaled[0] / 2,
        mapOffsetTiles[1] * this.tileSizeScaled[1] - this.tileSizeScaled[1] / 2,
      ];

      this.layers = this.tilemap.layers
        .map((layerData, index) => {
          const isBg = layerData.name.startsWith("BG_");
          const isFg = layerData.name.startsWith("FG_");
          if (!isBg && !isFg) return;

          const layer = this.tilemap!.createLayer(
            layerData.name,
            tileset,
            mapOffsetPixels[0],
            mapOffsetPixels[1],
          )!
            .setScale(SCALE_TILES)
            .setDepth((isFg ? DEPTH_FG_BASE : DEPTH_BG_BASE) + index);
          layer.setCollisionByProperty({ collides: true });

          if (isDebug) {
            const debugGraphics = this.add
              .graphics()
              .setAlpha(0.5)
              .setDepth(999);
            layer.renderDebug(debugGraphics, {
              tileColor: null,
              collidingTileColor: new Phaser.Display.Color(243, 234, 48),
              faceColor: new Phaser.Display.Color(40, 39, 37),
            });
          }

          return layer;
        })
        .filter(
          (layer) => layer !== undefined,
        ) as Phaser.Tilemaps.TilemapLayer[];
    }

    if (this.audioParams?.Bgm?.TxId) {
      this.bgm = this.sound.add(`audio_${this.audioParams.Bgm.TxId}`);
      this.bgm.play({
        volume: 0.2,
        loop: true,
      });
    }

    const spawnTile = this._2dTileParams?.Spawn ?? [0, 0];
    this.spawnPixel = [
      spawnTile[0] * this.tileSizeScaled[0],
      spawnTile[1] * this.tileSizeScaled[1],
    ];

    this.camera.centerOn(this.spawnPixel[0], this.spawnPixel[1]);

    if (
      !this.worldState.entities[this.playerAddress] ||
      this.warpTarget.position !== undefined
    ) {
      console.warn(
        `Player entity ${this.playerAddress} not found in entities list`,
      );
      this.worldState.entities[this.playerAddress] = {
        Type: "Avatar",
        Position: this.warpTarget.position ?? spawnTile,
        ...(this.playerProfileInfo && {
          Metadata: {
            ProfileId: this.playerProfileInfo.ProfileId,
          },
        }),
      };
    }
    const avatarEntityIds = Object.keys(this.worldState.entities).filter(
      (entityId) => this.worldState.entities[entityId].Type === "Avatar",
    );
    this.avatarEntityContainers = avatarEntityIds
      .map((entityId) => {
        const entity = this.worldState.entities[entityId];
        if (entityId !== this.playerAddress && entity.StateCode === 0) {
          // This entity is hidden, shouldn't be here
          console.warn(`Entity ${entityId} is hidden, skipping`);
          return {};
        }

        const profileMaybe = this.worldState.profiles.find(
          (profile) => profile.ProfileId === entity.Metadata?.ProfileId,
        );
        const entityContainer = this.createAvatarEntityContainer(
          entityId,
          entity,
          profileMaybe,
        );

        return {
          [entityId]: entityContainer,
        };
      })
      .reduce((acc, val) => ({ ...acc, ...val }), {});
    console.log(
      `Created ${this.avatarEntityContainers.length} avatar entities`,
    );

    this.playerSpriteKeyBase = this.spriteKeyBase(
      this.playerAddress,
      this.worldState.entities[this.playerAddress],
    );
    this.player = this.avatarEntityContainers[this.playerAddress];
    this.camera.startFollow(this.player);
    if (this.layers) {
      this.physics.add.collider(this.player, this.layers);
    }

    const warpEntityIds = Object.keys(this.worldState.entities).filter(
      (entityId) =>
        this.worldState.entities[entityId].Metadata?.Interaction?.Type ===
        "Warp",
    );
    this.warpSprites = warpEntityIds
      .map((entityId) => {
        const entity = this.worldState.entities[entityId];
        const warpSprite = this.createWarpEntity(entityId, entity);

        return {
          [entityId]: warpSprite,
        };
      })
      .reduce((acc, val) => ({ ...acc, ...val }), {});

    if (isDebug) {
      this.add
        .text(this.spawnPixel[0], this.spawnPixel[1], "X", {
          font: "20px Courier",
          color: "#ff0000",
        })
        .setOrigin(0.5);
      this.add
        .text(0, 0, "O", {
          font: "20px Courier",
          color: "#0000ff",
        })
        .setOrigin(0.5);

      const topLeft = this.topLeftInitial();
      this.add.text(
        topLeft.x + 10,
        topLeft.y + 10,
        `Reality ID: ${this.worldId}`,
        { font: "20px Courier", color: "#ff0000" },
      );
      this.add.text(
        topLeft.x + 10,
        topLeft.y + 40,
        `Reality Name: ${this.worldState.info.Name}`,
        { font: "20px Courier", color: "#ff0000" },
      );
    }

    // Only show tutorial if it's not done
    if (localStorage.getItem("tutorialDone") === null) {
      this.time.delayedCall(500, this.showTutorial, [], this);
    }

    emitSceneReady(this);
  }

  public spriteKeyBase(entityId: string, entity: RealityEntity) {
    const isPlayer = entityId === this.playerAddress;
    const spriteData =
      entity.Metadata?.SpriteTxId !== undefined
        ? {
            sprite: entity.Metadata?.SpriteTxId,
            atlas: entity.Metadata?.SpriteAtlasTxId,
          }
        : isPlayer &&
            this.worldState.parameters["2D-Tile-0"]?.PlayerSpriteTxId !==
              undefined
          ? {
              sprite: this.worldState.parameters["2D-Tile-0"]?.PlayerSpriteTxId,
              atlas:
                this.worldState.parameters["2D-Tile-0"]?.PlayerSpriteAtlasTxId,
            }
          : undefined;

    return spriteData !== undefined
      ? `sprite_${spriteData.sprite}_${spriteData.atlas ?? "default"}`
      : `llama_${entity.Metadata?.SkinNumber ?? (isPlayer ? 0 : 4)}`;
  }

  getDirectionFromPositions(
    oldPosition: Point2D,
    newPosition: Point2D,
  ): string {
    const dx = newPosition.x - oldPosition.x;
    const dy = newPosition.y - oldPosition.y;

    return getDirectionFromDelta(dx, dy);
  }

  playAni(
    entity: Phaser.GameObjects.Sprite,
    animBase: string,
    animEnd: string,
  ) {
    const resolvedAnimEnd = resolveSystemAniToExistingAni(animEnd, (testEnd) =>
      entity.anims.animationManager.exists(`${animBase}_${testEnd}`),
    );
    // console.log({ animBase, animEnd, resolvedAnimEnd });

    const resolvedAnim = `${animBase}_${resolvedAnimEnd}`;
    entity.play(resolvedAnim, true);
    entity.flipX =
      animEnd.endsWith("_left") && !resolvedAnimEnd.endsWith("_left");
  }

  public mergeEntities(
    entityUpdates: RealityEntityKeyed,
    profiles: Array<ProfileInfo>,
  ) {
    Object.keys(entityUpdates).forEach((entityId) => {
      const entityUpdate = entityUpdates[entityId];
      if (entityUpdate.Type === "Avatar") {
        const spriteKeyBase = this.spriteKeyBase(entityId, entityUpdate);
        if (entityId === this.playerAddress) {
          // Update the player's sprite key if the skin has changed
          if (spriteKeyBase !== this.playerSpriteKeyBase) {
            this.playerSpriteKeyBase = spriteKeyBase;
            // Update the player's animation with the new skin
            const playerSprite = this.player.getAt(
              0,
            ) as Phaser.GameObjects.Sprite;
            this.playAni(playerSprite, this.playerSpriteKeyBase, "idle");
            // Recreate pointerdown event listener
            playerSprite.removeListener("pointerdown");
            this.addDefaultEmote(
              entityId,
              entityUpdate,
              playerSprite,
              spriteKeyBase,
            );
          }
          return; // Skip further movement logic for the player
        }
        if (this.avatarEntityContainers[entityId]) {
          console.log(`Updating entity ${entityId}`);
          const entityContainer = this.avatarEntityContainers[entityId];
          if (!entityContainer) return;

          if (entityUpdate.StateCode === 0) {
            console.log(`Hiding entity ${entityId}`);
            // Dereference in the containers object,
            // in case it needs to be replaced
            delete this.avatarEntityContainers[entityId];
            // Fade out & destroy the container
            this.tweens.add({
              targets: entityContainer,
              alpha: 0,
              duration: 900,
              onComplete: () => {
                entityContainer.destroy();
              },
            });
          }

          const entitySprite = entityContainer.getAt(
            0,
          ) as Phaser.GameObjects.Sprite;

          // Recreate pointerdown event listener
          if (
            entityUpdate.Metadata?.Interaction?.Type === undefined ||
            entityUpdate.Metadata?.Interaction?.Type === "Default"
          ) {
            entitySprite.removeListener("pointerdown");
            this.addDefaultEmote(
              entityId,
              entityUpdate,
              entitySprite,
              spriteKeyBase,
            );
          }

          const updatePosition: Point2D = {
            x: entityUpdate.Position[0] * this.tileSizeScaled[0],
            y: entityUpdate.Position[1] * this.tileSizeScaled[1],
          };

          // Check previous position if it exists
          const workingLastPosition = entityContainer.lastPosition || {
            x: entityContainer.x,
            y: entityContainer.y,
          };

          entityContainer.lastPosition = {
            x: updatePosition.x,
            y: updatePosition.y,
          };

          if (
            !this.withinBox(entityContainer, {
              center: updatePosition,
              edgeLength: SCALE_ENTITIES * OBJECT_SIZE_ENTITY * 2,
            })
          ) {
            this.entityTargets[entityId]?.destroy();
            delete this.entityTargets[entityId];

            this.entityTargets[entityId] = this.physics.add
              .sprite(updatePosition.x, updatePosition.y, "invis")
              .setScale(SCALE_ENTITIES)
              .setOrigin(0.5)
              .setSize(OBJECT_SIZE_ENTITY, OBJECT_SIZE_ENTITY);

            const directionStr = this.getDirectionFromPositions(
              workingLastPosition,
              updatePosition,
            );
            this.playAni(entitySprite, spriteKeyBase, `walk_${directionStr}`);
            this.physics.moveToObject(
              entityContainer,
              this.entityTargets[entityId],
              120,
            );
            this.physics.add.overlap(
              entityContainer,
              this.entityTargets[entityId],
              () => {
                console.log(`Entity ${entityId} collided with target`);
                const containerBody =
                  entityContainer.body as Phaser.Physics.Arcade.Body;
                containerBody.setVelocity(0, 0);
                this.playAni(
                  entitySprite,
                  spriteKeyBase,
                  `idle_${directionStr}`,
                );
                // entitySprite.setPosition(updatePosition.x, updatePosition.y);

                this.entityTargets[entityId]?.destroy();
                delete this.entityTargets[entityId];
              },
            );
          }
        } else {
          console.log(`Creating entity ${entityId}`);
          const profileMaybe = profiles?.find(
            (profile) => profile.ProfileId === entityUpdate.Metadata?.ProfileId,
          );
          const entityContainer = this.createAvatarEntityContainer(
            entityId,
            entityUpdate,
            profileMaybe,
          );
          this.avatarEntityContainers[entityId] = entityContainer;
        }
      } else if (entityUpdate.Metadata?.Interaction?.Type === "Warp") {
        console.log(`Regenerating warp entity ${entityId}`);
        this.warpSprites[entityId]?.destroy();
        delete this.warpSprites[entityId];
        this.warpLabels[entityId]?.destroy();
        delete this.warpLabels[entityId];

        if (entityUpdate.StateCode === 0) {
          console.log(`Skipping hidden warp ${entityId}`);
          return;
        }
        this.warpSprites[entityId] = this.createWarpEntity(
          entityId,
          entityUpdate,
        );
      }
    });
  }

  createWarpEntity(entityId: string, entity: RealityEntity) {
    console.log(`Creating warp entity ${entityId}`);
    if (entity.Metadata?.Interaction?.Type !== "Warp") {
      throw new Error(`Entity ${entityId} is not a warp entity`);
    }
    const position = [
      entity.Position[0] * this.tileSizeScaled[0],
      entity.Position[1] * this.tileSizeScaled[1],
    ];
    const sprite = this.physics.add
      .sprite(position[0], position[1], "invis")
      .setScale(SCALE_ENTITIES)
      .setOrigin(0.5)
      .setDepth(DEPTH_ENTITY_BASE + 1)
      .setInteractive();

    if (entity.Metadata?.Interaction.Size) {
      sprite.setSize(
        (entity.Metadata?.Interaction.Size[0] * this.tileSizeScaled[0]) / 2,
        (entity.Metadata?.Interaction.Size[1] * this.tileSizeScaled[1]) / 2,
      );
    }
    if (entity.StateCode === 0) {
      return sprite;
    }

    this.time.delayedCall(1000, () => {
      this.physics.add.overlap(
        this.player,
        sprite,
        () => {
          if (entity.Metadata?.Interaction?.Type !== "Warp") return;
          const resolvedTarget =
            entity.Metadata?.Interaction?.Target ?? entityId;

          console.log(`Collided with warp ${entityId} (to ${resolvedTarget})`);
          if (this.isWarping) return;
          this.isWarping = true;

          const resolvedPosition = entity.Metadata?.Interaction?.Position;
          if (resolvedTarget === this.worldId && resolvedPosition) {
            this.player.setPosition(
              resolvedPosition[0] * this.tileSizeScaled[0],
              resolvedPosition[1] * this.tileSizeScaled[1],
            );
            this.isWarping = false;
            return;
          }

          emitSceneEvent({
            type: "Warp Immediate",
            warpTarget: {
              worldId: resolvedTarget,
              position: entity.Metadata?.Interaction?.Position,
            },
          });
          this.camera.fadeOut(5_000);
          this.tweens.addCounter({
            duration: 2_000,
            from: 60,
            to: 0,
            onUpdate: (tween) => {
              this.slowMs = tween.getValue();
            },
          });
        },
        undefined,
        this,
      );
    });

    const displayText = entity.Metadata?.DisplayName;
    if (displayText) {
      const warpLabel = this.add
        .text(position[0], position[1] - 40, displayText, {
          fontSize: "10px",
          fontFamily: '"Press Start 2P"',
          color: "#eeeeee",
          strokeThickness: 2,
          stroke: "#111111",
          // resolution: 8,
          shadow: {
            offsetX: 1,
            offsetY: 1,
            color: "#111111",
            blur: 1,
            stroke: true,
            fill: true,
          },
        })
        .setOrigin(0.5)
        .setDepth(DEPTH_TEXT_BASE);
      this.warpLabels[entityId] = warpLabel;
    }

    return sprite;
  }

  addDefaultEmote(
    entityId: string,
    entity: RealityEntity,
    sprite: Phaser.GameObjects.Sprite,
    spriteKeyBase: string,
  ) {
    const isBouncer = bouncerEntityIds.includes(entityId);
    sprite.on(
      "pointerdown",
      () => {
        this.playAni(sprite, spriteKeyBase, `emote`);
        if (entity.Metadata?.Interaction?.Type === "Default") {
          this.aoContractClientForProcess(entityId).message({
            tags: [
              {
                name: "Action",
                value: "DefaultInteraction",
              },
            ],
          });
        }
        setTimeout(() => {
          this.playAni(sprite, spriteKeyBase, `idle`);
          if (isBouncer) {
            this.showEntityChatMessages([
              {
                Id: 0,
                Timestamp: 0,
                MessageId: "",
                AuthorId: entityId,
                AuthorName: "Bouncer",
                Content: "Go away!",
              },
            ]);
          }
        }, 1000);
      },
      this,
    );
  }

  createAvatarEntityContainer(
    entityId: string,
    entity: RealityEntity,
    profile?: ProfileInfo,
  ) {
    const isPlayer = entityId === this.playerAddress;

    const container = this.add
      .container(
        entity.Position[0] * this.tileSizeScaled[0],
        entity.Position[1] * this.tileSizeScaled[1],
      )
      .setDepth(isPlayer ? DEPTH_PLAYER_BASE + 1 : DEPTH_ENTITY_BASE + 1);

    const spriteKeyBase = this.spriteKeyBase(entityId, entity);

    const sprite = this.add
      .sprite(0, 0, `${spriteKeyBase}_idle`)
      .setScale(SCALE_ENTITIES)
      .setOrigin(0.5)
      .setInteractive();

    if (isPlayer) {
      this.playAni(sprite, spriteKeyBase, `idle`);
    } else {
      this.playAni(sprite, spriteKeyBase, `idle`);
    }

    if (
      entity.Metadata?.Interaction?.Type === "SchemaForm" ||
      entity.Metadata?.Interaction?.Type === "SchemaExternalForm"
    ) {
      sprite.on(
        "pointerdown",
        () => {
          console.log(`Clicked on SchemaForm(External) ${entityId}`);
          this.showSchemaForm(entityId, entity);
        },
        this,
      );
    } else {
      this.addDefaultEmote(entityId, entity, sprite, spriteKeyBase);
    }

    sprite.on(
      "pointerover",
      () => {
        console.log(`Hovered over avatar ${entityId}`);
      },
      this,
    );

    const resolvedProfile =
      (isPlayer ? this.playerProfileInfo : undefined) ?? profile;
    const displayText =
      entity.Metadata?.DisplayName ??
      resolvedProfile?.DisplayName ??
      resolvedProfile?.Username ??
      truncateAddress(entityId, 4, 3, "…");

    const nameText = this.add
      .text(0, -40, displayText, {
        fontSize: "10px",
        fontFamily: '"Press Start 2P"',
        color: "#eeeeee",
        strokeThickness: 2,
        stroke: "#111111",
        // resolution: 8,
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: "#111111",
          blur: 1,
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH_TEXT_BASE);

    container.add(sprite);
    container.add(nameText);

    if (isPlayer) {
      container.setSize(20 * 2, 18 * 2);
    } else {
      container.setSize(OBJECT_SIZE_ENTITY, OBJECT_SIZE_ENTITY);
    }

    this.physics.world.enable(container);

    if (isPlayer) {
      (container.body as Phaser.Physics.Arcade.Body).setOffset(1, 15);
    }

    return container;
  }

  public withinBox(point: Point2D, bounds: BoxCentered) {
    const withinX =
      point.x >= bounds.center.x - bounds.edgeLength / 2 &&
      point.x <= bounds.center.x + bounds.edgeLength / 2;
    const withinY =
      point.y >= bounds.center.y - bounds.edgeLength / 2 &&
      point.y <= bounds.center.y + bounds.edgeLength / 2;

    return withinX && withinY;
  }

  public showEntityChatMessages(messages: ChatMessageHistory) {
    messages.forEach((message) => {
      const entityId = message.AuthorId;
      const entityContainer = this.avatarEntityContainers[entityId];

      if (!entityContainer) return;

      const chatBubble = this.add.container(25, -30);

      if (message.Content.length <= 8) {
        // speech_sm
        const speechBubbleSm = this.add
          .sprite(0, 0, "speech_sm")
          .setScale(1)
          .setOrigin(0);

        const chatText = this.add
          .text(10, 6, message.Content, {
            fontSize: "10px",
            fontFamily: '"Press Start 2P"',
            color: "#111111",
            // resolution: 8,
            shadow: {
              offsetX: 1,
              offsetY: 1,
              color: "#11111177",
              blur: 1,
              stroke: true,
              fill: true,
            },
          })
          .setOrigin(0)
          .setDepth(DEPTH_TEXT_BASE + 1);

        chatBubble.add(speechBubbleSm);
        chatBubble.add(chatText);
      } else {
        const speechBubbleMd = this.add
          .sprite(0, 0, "speech_md")
          .setScale(1)
          .setOrigin(0);
        const chatText = this.add
          .text(9, 5, message.Content, {
            fontSize: "8px",
            fontFamily: '"Press Start 2P"',
            color: "#111111",
            maxLines: 3,
            lineSpacing: 2,
            wordWrap: {
              width: 140,
              useAdvancedWrap: true,
            },
            // resolution: 8,
            shadow: {
              offsetX: 1,
              offsetY: 1,
              color: "#11111177",
              blur: 1,
              stroke: true,
              fill: true,
            },
          })
          .setOrigin(0)
          .setDepth(DEPTH_TEXT_BASE + 1);

        chatBubble.add(speechBubbleMd);
        chatBubble.add(chatText);
      }

      entityContainer.add(chatBubble);
      setTimeout(() => {
        chatBubble.destroy();
      }, 5000);
    });
  }

  public update(/* t: number, dt: number */) {
    if (!this.player) return;
    if (!this.arrows) return;

    const speed = this.isWarping ? this.slowMs : this.fastMs;

    const isLeft =
      //@ts-expect-error - Phaser types are wrong
      (this.arrows?.left.isDown || this.wasd?.left?.isDown) ?? false;
    const isRight =
      //@ts-expect-error - Phaser types are wrong
      (this.arrows?.right.isDown || this.wasd?.right?.isDown) ?? false;
    //@ts-expect-error - Phaser types are wrong
    const isUp = (this.arrows?.up.isDown || this.wasd?.up?.isDown) ?? false;
    const isDown =
      //@ts-expect-error - Phaser types are wrong
      (this.arrows?.down.isDown || this.wasd?.down?.isDown) ?? false;

    const playerSprite = this.player.getAt(0) as Phaser.GameObjects.Sprite;
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    if (isLeft) {
      playerBody.setVelocityX(-speed);
    } else if (isRight) {
      playerBody.setVelocityX(speed);
    } else {
      playerBody.setVelocityX(0);
    }

    if (isUp) {
      playerBody.setVelocityY(-speed);
    } else if (isDown) {
      playerBody.setVelocityY(speed);
    } else {
      playerBody.setVelocityY(0);
    }

    const direction = `${
      isUp ? "up" : isDown ? "down" : ""
    }${(isLeft || isRight) && (isUp || isDown) ? "_" : ""}${isLeft ? "left" : isRight ? "right" : ""}`;
    const isMoving = isLeft || isRight || isUp || isDown;

    const changeAni =
      isMoving !== this.lastTickMoving || direction !== this.lastTickDirection;
    if (changeAni) {
      const aniDirection = direction || this.lastTickDirection;
      if (isMoving) {
        this.playAni(
          playerSprite,
          this.playerSpriteKeyBase,
          `walk${aniDirection ? `_${aniDirection}` : ""}`,
        );
      } else {
        this.playAni(
          playerSprite,
          this.playerSpriteKeyBase,
          `idle${this.lastTickDirection ? `_${this.lastTickDirection}` : ""}`,
        );
      }
    }

    if (isMoving) {
      // Check if the player is overlapping with any warp entities
      const isOverlappingWithWarp = this.physics.overlap(
        this.player,
        Object.values(this.warpSprites),
      );
      if (isOverlappingWithWarp) {
        console.debug("Player is overlapping with warp, cancelling update");
        return;
      }

      emitSceneEvent({
        type: "Update Position",
        position: [
          this.player.x / this.tileSizeScaled[0],
          this.player.y / this.tileSizeScaled[1],
        ],
      });
    }

    this.lastTickMoving = isMoving;
    this.lastTickDirection = direction;

    if (this.tutorial) {
      const tl = this.topLeftDynamic();
      const pos = {
        x: tl.x + 20,
        y: tl.y + 20,
      };
      // console.log(`Tutorial position: ${pos.x}, ${pos.y}`);
      // Linear tween to move to position
      this.tweens.add({
        targets: this.tutorial,
        x: pos.x,
        y: pos.y,
        duration: 500,
      });
    }
  }

  showTutorial() {
    if (this.tutorial) {
      this.tutorial.destroy();
    }

    const tutorialSize: Size2D = {
      w: 300,
      h: 400,
    };
    const tl = this.topLeftInitial();
    const tutorialPos = {
      x: tl.x + 20,
      y: tl.y + 20,
    };
    const memElement = document.createElement("div");
    memElement.setAttribute(
      "style",
      `width: ${tutorialSize.w}px; height: ${tutorialSize.h}px; display: flex; justify-content: center; align-items: center;`,
    );
    ReactDOM.createRoot(memElement).render(
      <TutorialOverlay
        close={() => {
          localStorage.setItem("tutorialDone", "true");
          this.tutorial?.destroy();
        }}
      />,
    );

    this.tutorial = this.add
      .dom(tutorialPos.x, tutorialPos.y, memElement)
      .setOrigin(0, 0);
  }

  public showSchemaForm(entityId: string, entity: RealityEntity) {
    if (this.schemaForm) {
      this.schemaForm.destroy();
    }

    if (
      entity.Metadata?.Interaction?.Type !== "SchemaExternalForm" &&
      entity.Metadata?.Interaction?.Type !== "SchemaForm"
    )
      return;
    const isExternal =
      entity.Metadata?.Interaction?.Type === "SchemaExternalForm";

    const resolvedProcessId = entity.Metadata?.Interaction.Target ?? entityId;

    const formSize: Size2D = {
      w: 350,
      h: 500,
    };
    const memElement = document.createElement("div");
    memElement.setAttribute(
      "style",
      `width: ${formSize.w}px; height: ${formSize.h}px; display: flex; justify-content: center; align-items: center;`,
    );
    const root = ReactDOM.createRoot(memElement);
    root.render(
      <FormOverlay
        clickTime={Date.now()}
        aoContractClientForProcess={this.aoContractClientForProcess}
        schemaProcessId={resolvedProcessId}
        isExternal={isExternal}
        methodName={entity.Metadata?.Interaction.Id}
        close={() => {
          this.schemaForm?.destroy();
          root.unmount();
          this.camera.startFollow(this.player);
          this.inputEnable();
        }}
      />,
    );

    const currentEntityMaybe = this.avatarEntityContainers[entityId];
    const basePosition = {
      x: currentEntityMaybe.x ?? entity.Position[0] * this.tileSizeScaled[0],
      y: currentEntityMaybe.y ?? entity.Position[1] * this.tileSizeScaled[1],
    };
    this.schemaForm = this.add
      .dom(basePosition.x - 60, basePosition.y - 150, memElement)
      .setOrigin(1, 0);

    this.camera.stopFollow();
    this.camera.pan(
      basePosition.x + 100,
      basePosition.y + 200,
      500,
      Phaser.Math.Easing.Linear,
      false,
    );

    this.inputDisable();
  }

  public onWarpBegin() {
    if (this.isWarping) {
      const topLeft = this.topLeftDynamic();
      this.loadText = this.add.text(
        topLeft.x + 10,
        topLeft.y + 70,
        "Loading...",
        { font: "20px Courier", color: "#00ff00" },
      );
    }
  }

  public onWarpAbort() {
    if (!this.isWarping) {
      this.loadText.destroy();
    }
  }

  public onWarpSuccess() {
    this.bgm?.stop();
  }
}
