import { WarpableScene } from "./WarpableScene";
import { VerseState } from "../../load/model";
import { phaserTilemapKey, phaserTilesetKey } from "../../load/verse";
import { _2dTileParams } from "@/features/verse/contract/_2dTile";
import { emitSceneReady, emitSceneEvent } from "../../EventBus";
import { VerseEntity, VerseEntityKeyed } from "@/features/verse/contract/model";
import ReactDOM from "react-dom/client";
import { BoxCentered, Point2D, Size2D } from "../../model";
import { FormOverlay } from "@/features/render/components/FormOverlay";
import { AoContractClientForProcess } from "@/features/ao/lib/aoContractClient";
import { isDebug } from "../game";
import { truncateAddress } from "@/features/arweave/lib/utils";
import { ProfileInfo } from "@/features/profile/contract/model";
import { MessageHistory } from "@/features/chat/contract/model";
import TutorialOverlay from "@/features/render/components/TutorialOverlay";

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

export class VerseScene extends WarpableScene {
  playerAddress!: string;
  playerProfileInfo?: ProfileInfo;
  verseId!: string;
  verse!: VerseState;
  aoContractClientForProcess!: AoContractClientForProcess;

  _2dTileParams?: _2dTileParams;
  tilesetTxId?: string;
  tilemapTxId?: string;

  tileSizeScaled: [number, number] = [
    DEFAULT_TILE_SIZE_SCALED,
    DEFAULT_TILE_SIZE_SCALED,
  ];
  spawnPixel: [number, number] = [0, 0];

  loadText!: Phaser.GameObjects.Text;

  camera!: Phaser.Cameras.Scene2D.Camera;

  tilemap?: Phaser.Tilemaps.Tilemap;
  layers?: Phaser.Tilemaps.TilemapLayer[];

  player!: Phaser.GameObjects.Container;

  arrows?: object;
  wasd?: object;

  lastTickMoving: boolean = false;

  isWarping: boolean = false;

  avatarEntityContainers: Record<string, Phaser.GameObjects.Container> = {};
  warpSprites: Record<string, Phaser.Physics.Arcade.Sprite> = {};
  entityTargets: Record<string, Phaser.Physics.Arcade.Sprite> = {};

  activeEntityEvent?: Phaser.GameObjects.GameObject;

  tutorial?: Phaser.GameObjects.DOMElement;
  schemaForm?: Phaser.GameObjects.DOMElement;

  slowMs: number = 120;

  constructor() {
    super("VerseScene");
  }

  init({
    playerAddress,
    playerProfileInfo,
    verseId,
    verse,
    aoContractClientForProcess,
  }: {
    playerAddress: string;
    playerProfileInfo?: ProfileInfo;
    verseId: string;
    verse: VerseState;
    aoContractClientForProcess: AoContractClientForProcess;
  }) {
    // reset some vars
    this.isWarping = false;
    this.activeEntityEvent = undefined;
    this.layers = undefined;
    this.slowMs = 120;

    this.playerAddress = playerAddress;
    this.playerProfileInfo = playerProfileInfo;
    this.verseId = verseId;
    this.verse = verse;
    this.aoContractClientForProcess = aoContractClientForProcess;

    this._2dTileParams = this.verse.parameters["2D-Tile-0"];

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
    const cameraCenter = {
      x: this.camera.worldView.x,
      y: this.camera.worldView.y,
    };

    return {
      x: cameraCenter.x,
      y: cameraCenter.y,
    };
  }

  preload() {}

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x111111);

    if (this.tilesetTxId && this.tilemapTxId) {
      console.log(
        `[${this.verse.info.Name}] Loading tilemap ${this.tilemapTxId} and tileset ${this.tilesetTxId}`,
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

      const mapOffsetTiles = this.verse.parameters["2D-Tile-0"]?.Tilemap
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

    const spawnTile = this._2dTileParams?.Spawn ?? [0, 0];
    this.spawnPixel = [
      spawnTile[0] * this.tileSizeScaled[0],
      spawnTile[1] * this.tileSizeScaled[1],
    ];

    this.camera.centerOn(this.spawnPixel[0], this.spawnPixel[1]);

    if (!this.verse.entities[this.playerAddress]) {
      console.warn(
        `Player entity ${this.playerAddress} not found in entities list`,
      );
      this.verse.entities[this.playerAddress] = {
        Type: "Avatar",
        Position: spawnTile,
        ...(this.playerProfileInfo && {
          Metadata: {
            ProfileId: this.playerProfileInfo.ProfileId,
          },
        }),
      };
    }
    const avatarEntityIds = Object.keys(this.verse.entities).filter(
      (entityId) => this.verse.entities[entityId].Type === "Avatar",
    );
    this.avatarEntityContainers = avatarEntityIds
      .map((entityId) => {
        const entity = this.verse.entities[entityId];
        if (entityId !== this.playerAddress && entity.StateCode === 0) {
          // This entity is hidden, shouldn't be here
          console.warn(`Entity ${entityId} is hidden, skipping`);
          return {};
        }

        const profileMaybe = this.verse.profiles.find(
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

    this.player = this.avatarEntityContainers[this.playerAddress];
    this.camera.startFollow(this.player);
    if (this.layers) {
      this.physics.add.collider(this.player, this.layers);
    }

    const warpEntityIds = Object.keys(this.verse.entities).filter(
      (entityId) =>
        this.verse.entities[entityId].Metadata?.Interaction?.Type === "Warp",
    );
    this.warpSprites = warpEntityIds
      .map((entityId) => {
        const entity = this.verse.entities[entityId];
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
        `Verse ID: ${this.verseId}`,
        { font: "20px Courier", color: "#ff0000" },
      );
      this.add.text(
        topLeft.x + 10,
        topLeft.y + 40,
        `Verse Name: ${this.verse.info.Name}`,
        { font: "20px Courier", color: "#ff0000" },
      );
    }

    // Only show tutorial if it's not done
    if (localStorage.getItem("tutorialDone") === null) {
      this.time.delayedCall(500, this.showTutorial, [], this);
    }

    emitSceneReady(this);
  }

  public mergeEntities(
    entityUpdates: VerseEntityKeyed,
    profiles: Array<ProfileInfo>,
  ) {
    Object.keys(entityUpdates).forEach((entityId) => {
      // Ignore player character
      if (entityId === this.playerAddress) return;

      const entityUpdate = entityUpdates[entityId];
      if (entityUpdate.Type !== "Avatar") return;

      const skinNumber = entityUpdate.Metadata?.SkinNumber ?? 4;

      if (this.avatarEntityContainers[entityId]) {
        console.log(`Updating entity ${entityId}`);
        const entityContainer = this.avatarEntityContainers[entityId];
        if (!entityContainer) return;

        if (entityUpdate.StateCode === 0) {
          console.log(`Hiding entity ${entityId}`);
          // Dereference in the containers object
          delete this.avatarEntityContainers[entityId];
          // Fade out & destroy the container
          this.tweens.add({
            targets: entityContainer,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              entityContainer.destroy();
            },
          });
        }

        const entitySprite = entityContainer.getAt(
          0,
        ) as Phaser.GameObjects.Sprite;

        const updatePosition: Point2D = {
          x: entityUpdate.Position[0] * this.tileSizeScaled[0],
          y: entityUpdate.Position[1] * this.tileSizeScaled[1],
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

          entitySprite.play(`llama_${skinNumber}_walk`);
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
              entitySprite.play(`llama_${skinNumber}_idle`);
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
        const entitySprite = this.createAvatarEntityContainer(
          entityId,
          entityUpdate,
          profileMaybe,
        );
        this.avatarEntityContainers[entityId] = entitySprite;
      }
    });
  }

  createWarpEntity(entityId: string, entity: VerseEntity) {
    console.log(`Creating warp entity ${entityId}`);
    if (entity.Metadata?.Interaction?.Type !== "Warp") {
      throw new Error(`Entity ${entityId} is not a warp entity`);
    }
    const sprite = this.physics.add
      .sprite(
        entity.Position[0] *
          (this.tileSizeScaled[0] ?? DEFAULT_TILE_SIZE_SCALED),
        entity.Position[1] *
          (this.tileSizeScaled[1] ?? DEFAULT_TILE_SIZE_SCALED),
        "invis",
      )
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
    this.time.delayedCall(1000, () => {
      this.physics.add.overlap(
        this.player,
        sprite,
        () => {
          console.log(`Collided with warp ${entityId}`);
          if (this.isWarping) return;
          this.isWarping = true;
          emitSceneEvent({
            type: "Warp Immediate",
            verseId: entityId,
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

    return sprite;
  }

  createAvatarEntityContainer(
    entityId: string,
    entity: VerseEntity,
    profile?: ProfileInfo,
  ) {
    const isPlayer = entityId === this.playerAddress;
    const isBouncer = bouncerEntityIds.includes(entityId);
    const llamaSpriteIndex = isPlayer ? 0 : entity.Metadata?.SkinNumber ?? 4;

    const container = this.add
      .container(
        entity.Position[0] *
          (this.tileSizeScaled[0] ?? DEFAULT_TILE_SIZE_SCALED),
        entity.Position[1] *
          (this.tileSizeScaled[1] ?? DEFAULT_TILE_SIZE_SCALED),
      )
      .setDepth(isPlayer ? DEPTH_PLAYER_BASE + 1 : DEPTH_ENTITY_BASE + 1);

    const sprite = this.add
      .sprite(0, 0, `llama_${llamaSpriteIndex}`)
      .setScale(SCALE_ENTITIES)
      .setOrigin(0.5)
      .setInteractive();

    if (isPlayer) {
      sprite.play(`llama_0_idle`);
    } else {
      sprite.play(`llama_${llamaSpriteIndex}_idle`);
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
      sprite.on(
        "pointerdown",
        () => {
          sprite.play(`llama_${llamaSpriteIndex}_emote`);
          setTimeout(() => {
            sprite.play(`llama_${llamaSpriteIndex}_idle`);
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

  public showEntityChatMessages(messages: MessageHistory) {
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

    const speed = this.isWarping ? this.slowMs : 120;

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
      playerSprite.flipX = true;
      playerBody.setVelocityX(-speed);
    } else if (isRight) {
      playerSprite.flipX = false;
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

    const isMoving = isLeft || isRight || isUp || isDown;
    if (isMoving) {
      if (!this.lastTickMoving) playerSprite.play("llama_0_walk");
      this.lastTickMoving = true;
    } else {
      if (this.lastTickMoving) {
        playerSprite.play("llama_0_idle");
      }
      this.lastTickMoving = false;
    }

    if (this.lastTickMoving) {
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
          this.player.x / DEFAULT_TILE_SIZE_SCALED,
          this.player.y / DEFAULT_TILE_SIZE_SCALED,
        ],
      });
    }

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

  public showSchemaForm(entityId: string, entity: VerseEntity) {
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

    const formSize: Size2D = {
      w: 350,
      h: 500,
    };
    const memElement = document.createElement("div");
    memElement.setAttribute(
      "style",
      `width: ${formSize.w}px; height: ${formSize.h}px; display: flex; justify-content: center; align-items: center;`,
    );
    ReactDOM.createRoot(memElement).render(
      <FormOverlay
        aoContractClientForProcess={this.aoContractClientForProcess}
        schemaProcessId={entityId}
        isExternal={isExternal}
        methodName={entity.Metadata?.Interaction.Id}
        close={() => {
          this.schemaForm?.destroy();
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
      const topLeft = this.topLeftInitial();
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
}
