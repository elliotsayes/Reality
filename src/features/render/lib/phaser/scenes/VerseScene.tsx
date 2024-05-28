
import { WarpableScene } from "./WarpableScene";
import { EventBus } from "../EventBus";
import { VerseState } from "../../load/model";
import { phaserTilemapKey, phaserTilesetKey } from "../../load/verse";
import { fetchUrl } from "@/features/arweave/lib/arweave";
import { _2dTileParams } from "@/features/verse/contract/_2dTile";

export class VerseScene extends WarpableScene {
  verseId!: string;
  verse!: VerseState;

  _2dTileParams?: _2dTileParams;
  tilesetTxId?: string;
  tilemapTxId?: string;

  spawnPixel!: [number, number];

  loadText!: Phaser.GameObjects.Text;

  camera!: Phaser.Cameras.Scene2D.Camera;
  tilemap!: Phaser.Tilemaps.Tilemap;

  constructor() {
    super('VerseScene');
  }

  init ({
    verseId,
    verse,
  }: {
    verseId: string,
    verse: VerseState,
  })
  {
    this.verseId = verseId;
    this.verse = verse;

    this._2dTileParams = this.verse.parameters["2D-Tile-0"];

    this.tilesetTxId = this._2dTileParams?.Tileset.TxId;
    this.tilemapTxId = this._2dTileParams?.Tilemap.TxId;
  }

  preload() {
    if (this.tilesetTxId && this.tilemapTxId) {
      this.load.image(phaserTilesetKey(this.tilesetTxId), fetchUrl(this.tilesetTxId));
      this.load.tilemapTiledJSON(phaserTilemapKey(this.tilemapTxId), fetchUrl(this.tilemapTxId));
    }
    this.load.image('mona', 'assets/sprites/mona.png');
    this.load.image('scream', 'assets/sprites/scream.png');
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

      const bgLayers = this.tilemap.layers.filter((layer) => layer.name.startsWith('BG_'));
      const fgLayers = this.tilemap.layers.filter((layer) => layer.name.startsWith('FG_'));

      const mapOffsetTiles = this.verse.parameters["2D-Tile-0"]?.Tilemap.Offset ?? [0, 0];
      // Center the tiles around the origins
      const mapOffsetPixels = [
        mapOffsetTiles[0] * this.tilemap.tileWidth - this.tilemap.tileWidth / 2,
        mapOffsetTiles[1] * this.tilemap.tileHeight - this.tilemap.tileWidth / 2,
      ];
      bgLayers.forEach(bgLayer => this.tilemap.createLayer(bgLayer.name, tileset, mapOffsetPixels[0], mapOffsetPixels[1]))
      fgLayers.forEach(fgLayer => this.tilemap.createLayer(fgLayer.name, tileset, mapOffsetPixels[0], mapOffsetPixels[1]))

      console.log(`Tilemap size: ${this.tilemap.widthInPixels}, ${this.tilemap.heightInPixels}`)

      const spawnTile = this._2dTileParams?.Spawn ?? [0, 0];
      this.spawnPixel = [
        spawnTile[0] * this.tilemap.tileWidth,
        spawnTile[1] * this.tilemap.tileHeight,
      ];
    } else {
      this.spawnPixel = [0, 0];
    }

    this.add.text(this.spawnPixel[0], this.spawnPixel[1], 'X', {
      font: '20px Courier', color: '#ff0000',
    }).setOrigin(0.5);

    this.camera.centerOn(this.spawnPixel[0], this.spawnPixel[1])

    Object.keys(this.verse.entities).forEach((entityId) => {
      const entity = this.verse.entities[entityId];
      if (entity.Type === 'Avatar')
        this.add.image(
          entity.Position[0] * this.tilemap.tileWidth,
          entity.Position[1] * this.tilemap.tileHeight,
          'mona',
        );
      if (entity.Type === 'Warp')
        this.add.image(
          entity.Position[0] * this.tilemap.tileWidth,
          entity.Position[1] * this.tilemap.tileHeight,
          'scream',
        );
    })

    const topLeft = this.topLeft();
    this.add.text(topLeft.x + 10, topLeft.y + 10, `Verse ID: ${this.verseId}`, { font: '20px Courier', color: '#ff0000' });
    this.add.text(topLeft.x + 10, topLeft.y + 40, `Verse Name: ${this.verse.info.Name}`, { font: '20px Courier', color: '#ff0000' });

    EventBus.emit('current-scene-ready', this);
  }

  public onWarpBegin()
  {
    if (this.isLoadingWarp) {
      const topLeft = this.topLeft();
      this.loadText = this.add.text(topLeft.x + 10, topLeft.y + 70, 'Loading...', { font: '20px Courier', color: '#00ff00' });
    }
  }

  public onWarpAbort()
  {
    if (!this.isLoadingWarp) {
      this.loadText.destroy();
    }
  }
}