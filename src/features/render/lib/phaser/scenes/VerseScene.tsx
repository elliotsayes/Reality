
import { WarpableScene } from "./WarpableScene";
import { EventBus } from "../EventBus";
import { VerseState } from "../../load/model";
import { phaserTilemapKey, phaserTilesetKey } from "../../load/verse";
import { fetchUrl } from "@/features/arweave/lib/arweave";

export class VerseScene extends WarpableScene {
  verseId!: string;
  verse!: VerseState;

  tilesetTxId?: string;
  tilemapTxId?: string;

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

    this.tilesetTxId = this.verse.parameters["2D-Tile-0"]?.Tileset.TxId;
    this.tilemapTxId = this.verse.parameters["2D-Tile-0"]?.Tilemap.TxId;
  }

  preload() {
    if (this.tilesetTxId && this.tilemapTxId) {
      this.load.image(phaserTilesetKey(this.tilesetTxId), fetchUrl(this.tilesetTxId));
      this.load.tilemapTiledJSON(phaserTilemapKey(this.tilemapTxId), fetchUrl(this.tilemapTxId));
    }
  }

  create() {
    this.camera = this.cameras.main
    this.camera.setBackgroundColor(0x107ab0);

    let cameraOffset = {
      x: 0, 
      y: 0,
    }


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

      bgLayers.forEach(bgLayer => this.tilemap.createLayer(bgLayer.name, tileset, 0, 0))
      fgLayers.forEach(fgLayer => this.tilemap.createLayer(fgLayer.name, tileset, 0, 0))

      console.log(`Tilemap size: ${this.tilemap.widthInPixels}, ${this.tilemap.heightInPixels}`)
      cameraOffset = {
          x: this.tilemap.widthInPixels / 2, 
          y: this.tilemap.heightInPixels / 2,
      }
    }

    console.log(`Camera offset: ${cameraOffset.x}, ${cameraOffset.y}`)
    this.camera.centerOn(
      cameraOffset.x,
      cameraOffset.y,
    )

    const phaserGameSize = {
      w: this.game.config.width as number,
      h: this.game.config.height as number,
    }

    this.add.text(cameraOffset.x - phaserGameSize.w / 2 + 10, cameraOffset.y - phaserGameSize.h / 2 + 10, `Verse ID: ${this.verseId}`, { font: '16px Courier', color: '#ff0000' });
    this.add.text(cameraOffset.x - phaserGameSize.w / 2 + 10, cameraOffset.y - phaserGameSize.h / 2 + 30, `Verse Name: ${this.verse.info.Name}`, { font: '16px Courier', color: '#ff0000' });

    EventBus.emit('current-scene-ready', this);
  }

  public onWarpBegin()
  {
    if (this.isLoadingWarp) {
      this.loadText = this.add.text(10, 50, 'Loading...', { font: '16px Courier', color: '#00ff00' });
    }
  }

  public onWarpAbort()
  {
    if (!this.isLoadingWarp) {
      this.loadText.destroy();
    }
  }
}