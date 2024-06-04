
import { WarpableScene } from "./WarpableScene";
import { VerseState } from "../../load/model";
import { phaserTilemapKey, phaserTilesetKey } from "../../load/verse";
import { _2dTileParams } from "@/features/verse/contract/_2dTile";
import { emitSceneReady, emitSceneEvent } from "../../EventBus";
import { VerseClient } from "@/features/verse/contract/verseClient";
import { VerseEntity } from "@/features/verse/contract/model";
import ReactDOM from "react-dom/client";
import { ElementSize } from "../../model";
import { FormOverlay } from "@/features/render/components/FormOverlay";
import { AoContractClientForProcess } from "@/features/ao/lib/aoContractClient";
import { isDebug } from "../game";

const SCALE_TILES = 3;
const SCALE_ENTITIES = 2;

const DEFAULT_TILE_SIZE_ORIGINAL = 16;
const DEFAULT_TILE_SIZE_SCALED = DEFAULT_TILE_SIZE_ORIGINAL * SCALE_TILES;

const DEPTH_BG_BASE = -200; // => -101
const DEPTH_FG_BASE = 100; // => 199
const DEPTH_ENTITY_BASE = -100; // => -1
const DEPTH_PLAYER_BASE = 0; // => 400

export class VerseScene extends WarpableScene {
  playerAddress!: string;
  verseId!: string;
  verse!: VerseState;
  aoContractClientForProcess!: AoContractClientForProcess;

  _2dTileParams?: _2dTileParams;
  tilesetTxId?: string;
  tilemapTxId?: string;

  tileSizeScaled: [number, number] = [DEFAULT_TILE_SIZE_SCALED, DEFAULT_TILE_SIZE_SCALED];
  spawnPixel: [number, number] = [0, 0];

  loadText!: Phaser.GameObjects.Text;

  camera!: Phaser.Cameras.Scene2D.Camera;

  tilemap?: Phaser.Tilemaps.Tilemap;
  layers?: Phaser.Tilemaps.TilemapLayer[];

  player!: Phaser.Physics.Arcade.Sprite;

  keys!: object;

  lastTickMoving: boolean = false;

  isWarping: boolean = false;

  entitySprites: Record<string, Phaser.Physics.Arcade.Sprite> = {};

  activeEntityEvent?: Phaser.GameObjects.GameObject;

  apiForm?: Phaser.GameObjects.DOMElement;

  constructor() {
    super('VerseScene');
  }

  init ({
    playerAddress,
    verseId,
    verse,
    aoContractClientForProcess,
  }: {
    playerAddress: string,
    verseId: string,
    verse: VerseState,
    aoContractClientForProcess: AoContractClientForProcess,
  })
  {
    // reset some vars
    this.isWarping = false;
    this.activeEntityEvent = undefined;
    this.layers = undefined;

    this.playerAddress = playerAddress;
    this.verseId = verseId;
    this.verse = verse;
    this.aoContractClientForProcess = aoContractClientForProcess;

    this._2dTileParams = this.verse.parameters["2D-Tile-0"];

    this.tilesetTxId = this._2dTileParams?.Tileset.TxId;
    this.tilemapTxId = this._2dTileParams?.Tilemap.TxId;

    this.keys = this.input.keyboard!.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
    });

    this.pixelateIn();
  }

  topLeft()
  {
    const cameraCenter = {
      x: this.spawnPixel[0],
      y: this.spawnPixel[1],
    };
    const cameraSize = {
      w: this.camera.width,
      h: this.camera.height,
    };
    console.log(`Camera center: ${cameraCenter.x}, ${cameraCenter.y}`)
    console.log(`Camera size: ${cameraSize.w}, ${cameraSize.h}`)

    return {
      x: cameraCenter.x - cameraSize.w / 2,
      y: cameraCenter.y - cameraSize.h / 2,
    }
  }

  preload()
  {
    
  }

  create()
  {
    this.camera = this.cameras.main
    this.camera.setBackgroundColor(0x107ab0);

    if (this.tilesetTxId && this.tilemapTxId) {
      console.log(`[${this.verse.info.Name}] Loading tilemap ${this.tilemapTxId} and tileset ${this.tilesetTxId}`)

      this.tilemap = this.make.tilemap({
        key: phaserTilemapKey(this.tilemapTxId),
      })
      const tileset = this.tilemap.addTilesetImage(
        'Primary',
        phaserTilesetKey(this.tilesetTxId),
      )!;

      this.tileSizeScaled = [this.tilemap.tileWidth * SCALE_TILES, this.tilemap.tileHeight * SCALE_TILES];

      const mapOffsetTiles = this.verse.parameters["2D-Tile-0"]?.Tilemap.Offset ?? [0, 0];
      // Center the tiles around the origins
      const mapOffsetPixels = [
        mapOffsetTiles[0] * this.tileSizeScaled[0] - this.tileSizeScaled[0] / 2,
        mapOffsetTiles[1] * this.tileSizeScaled[1] - this.tileSizeScaled[1] / 2,
      ];

      this.layers = this.tilemap.layers.map((layerData, index) => {
        const isBg = layerData.name.startsWith('BG_');
        const isFg = layerData.name.startsWith('FG_');
        if (!isBg && !isFg) return;

        const layer = this.tilemap!.createLayer(layerData.name, tileset, mapOffsetPixels[0], mapOffsetPixels[1])!
          .setScale(SCALE_TILES)
          .setDepth((isFg ? DEPTH_FG_BASE : DEPTH_BG_BASE) + index);
        layer.setCollisionByProperty({ collides: true })
        
        if (isDebug) {
          const debugGraphics = this.add.graphics().setAlpha(0.5).setDepth(999);
          layer.renderDebug(debugGraphics, {
            tileColor: null,
            collidingTileColor: new Phaser.Display.Color(243, 234, 48),
            faceColor: new Phaser.Display.Color(40, 39, 37),
          })
        }

        return layer;
      }).filter((layer) => layer !== undefined) as Phaser.Tilemaps.TilemapLayer[];
    }

    const spawnTile = this._2dTileParams?.Spawn ?? [0, 0];
    this.spawnPixel = [
      spawnTile[0] * this.tileSizeScaled[0],
      spawnTile[1] * this.tileSizeScaled[1],
    ];

    this.camera.centerOn(this.spawnPixel[0], this.spawnPixel[1])

    this.player = this.physics.add.sprite(
      this.spawnPixel[0],
      this.spawnPixel[1],
      'llama_0',
    )
      .setSize(20, 18)
      .setOffset(1, 18)
      .setScale(SCALE_ENTITIES)
      .setOrigin(0.5)
      .setDepth(DEPTH_PLAYER_BASE);
    this.player.play(`llama_0_idle`);
    this.camera.startFollow(this.player);
    
    if (this.layers) {
      this.physics.add.collider(
        this.player,
        this.layers,
      );
    }

    this.entitySprites = Object.keys(this.verse.entities).map((entityId) => {
      // Ignore player character
      if (entityId === this.playerAddress) return {};

      const entity = this.verse.entities[entityId];
      const sprite = this.createEntitySprite(entityId, entity);

      return {
        [entityId]: sprite,
      };
    }).reduce((acc, val) => ({ ...acc, ...val }), {});

    if (isDebug) {
      this.add.text(this.spawnPixel[0], this.spawnPixel[1], 'X', {
        font: '20px Courier', color: '#ff0000',
      }).setOrigin(0.5);
      this.add.text(0, 0, 'O', {
        font: '20px Courier', color: '#0000ff',
      }).setOrigin(0.5);

      const topLeft = this.topLeft();
      this.add.text(topLeft.x + 10, topLeft.y + 10, `Verse ID: ${this.verseId}`, { font: '20px Courier', color: '#ff0000' });
      this.add.text(topLeft.x + 10, topLeft.y + 40, `Verse Name: ${this.verse.info.Name}`, { font: '20px Courier', color: '#ff0000' });
    }
    emitSceneReady(this);
  }

  public mergeEntities(entityUpdates: Awaited<ReturnType<VerseClient['readAllEntities']>>)
  {
    Object.keys(entityUpdates).forEach((entityId) => {
      // Ignore player character
      if (entityId === this.playerAddress) return;

      const entityUpdate = entityUpdates[entityId];

      if (this.entitySprites[entityId]) {
        console.log(`Updating entity ${entityId}`)
        const entitySprite = this.entitySprites[entityId];
        entitySprite.setPosition(
          entityUpdate.Position[0] * this.tileSizeScaled[0],
          entityUpdate.Position[1] * this.tileSizeScaled[1],
        );
      } else {
        console.log(`Creating entity ${entityId}`)
        const entitySprite = this.createEntitySprite(entityId, entityUpdate);
        this.entitySprites[entityId] = entitySprite;
      }
    });
  }

  createEntitySprite(entityId: string, entity: VerseEntity) {
    const sprite = this.physics.add.sprite(
      entity.Position[0] * (this.tileSizeScaled[0] ?? DEFAULT_TILE_SIZE_SCALED),
      entity.Position[1] * (this.tileSizeScaled[1] ?? DEFAULT_TILE_SIZE_SCALED),
      entity.Type === 'Avatar' ? 'llama_4' : 'invis',
    )
      .setScale(SCALE_ENTITIES)
      .setOrigin(0.5)
      .setDepth(DEPTH_ENTITY_BASE + 1)
      .setInteractive();

    if (entity.Interaction?.Type === 'Warp') {
      console.log(`Creating warp entity ${entityId}`)
      if (entity.Interaction.Size) {
        sprite.setSize(
          entity.Interaction.Size[0] * this.tileSizeScaled[0] / 2,
          entity.Interaction.Size[1] * this.tileSizeScaled[1] / 2,
        )
      }
      this.physics.add.overlap(this.player, sprite, () => {
        console.log(`Collided with entity ${entityId}`)
        emitSceneEvent({
          type: 'Warp Immediate',
          verseId: entityId,
        })
        this.isWarping = true;
      }, undefined, this);
    }
    
    if (entity.Type === 'Avatar') {
      if (entity.Interaction?.Type === 'ApiForm') {
        // Llama Assistant
        sprite.play(`llama_5_idle`);
        sprite.on('pointerdown', () => {
          console.log(`Clicked on ApiForm ${entityId}`)
          this.showApiForm(entityId, entity);
        }, this)
      } else {
        sprite.play(`llama_4_idle`);
        sprite.on('pointerdown', () => {
          sprite.play(`llama_4_emote`);
          setTimeout(() => {
            sprite.play(`llama_4_idle`);
          }, 1000)
        }, this)
      }
    }

    sprite.on('pointerover', () => {
      console.log(`Hovered over entity ${entityId}`)
    }, this)

    return sprite;
  }

  public update(/* t: number, dt: number */)
  {
    if (!this.player) return;
    if (!this.keys) return;

    const speed = this.isWarping ? 40 : 120;

    if (this.keys.left.isDown)
    {
      this.player.flipX = true;
      this.player.setVelocityX(-speed);
    }
    else if (this.keys.right.isDown)
    {
      this.player.flipX = false;
      this.player.setVelocityX(speed);
    }
    else
    {
      this.player.setVelocityX(0);
    }


    if (this.keys.up.isDown)
    {
      this.player.setVelocityY(-speed);
    }
    else if (this.keys.down.isDown)
    {
      this.player.setVelocityY(speed);
    }
    else
    {
      this.player.setVelocityY(0);
    }

    const isMoving = this.keys.left.isDown || this.keys.right.isDown || this.keys.up.isDown || this.keys.down.isDown;
    if (isMoving)
    {
      if (!this.lastTickMoving) this.player.play('llama_0_walk');
      this.lastTickMoving = true;
    } else {
      if (this.lastTickMoving) {
        this.player.play('llama_0_idle');
        emitSceneEvent({
          type: 'Update Position',
          position: [
            this.player.x / DEFAULT_TILE_SIZE_SCALED,
            this.player.y / DEFAULT_TILE_SIZE_SCALED,
          ],
        })
      }
      this.lastTickMoving = false;
    }
  }

  public showApiForm(entityId: string, entity: VerseEntity)
  {
    if (this.apiForm) {
      this.apiForm.destroy();
    }

    if (entity.Interaction?.Type !== 'ApiForm') return;

    const formSize: ElementSize = {
      w: 300,
      h: 50,
    }
    const memElement = document.createElement("div");
    memElement.setAttribute('style', `width: ${formSize.w}px; height: ${formSize.h}px; display: flex; justify-content: center; align-items: center;`)
    ReactDOM.createRoot(memElement).render(
      <FormOverlay
        contractClient={this.aoContractClientForProcess(entityId)}
        methodName={entity.Interaction.Id}
        close={() => {
          this.apiForm?.destroy();
        }}
      />
    );

    this.apiForm = this.add.dom(
      entity.Position[0] * this.tileSizeScaled[0] - 30,
      entity.Position[1] * this.tileSizeScaled[1] - 20,
      memElement,
    ).setOrigin(1, 0);
  }

  public onWarpBegin()
  {
    if (this.isWarping) {
      const topLeft = this.topLeft();
      this.loadText = this.add.text(topLeft.x + 10, topLeft.y + 70, 'Loading...', { font: '20px Courier', color: '#00ff00' });
    }
  }

  public onWarpAbort()
  {
    if (!this.isWarping) {
      this.loadText.destroy();
    }
  }
}