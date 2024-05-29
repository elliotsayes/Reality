
import { Scene } from 'phaser';
import { CreateLoadVerse } from '../../load/verse';

export class WarpableScene extends Scene
{
  public isLoadingWarp: boolean = false;
  public loadVerse?: CreateLoadVerse;

  public setLoadVerse (loadVerse: CreateLoadVerse)
  {
    this.loadVerse = loadVerse;
  }

  pixelateIn ()
  {
    this.cameras.main.fadeIn(400);
    const fxCamera = this.cameras.main.postFX.addPixelate(20);
    this.add.tween({
        targets: fxCamera,
        duration: 400,
        amount: -1,
    });
  }

  public onWarpBegin ()
  {
    // Override this method to disable features in the scene
  }

  public onWarpAbort ()
  {
    // Override this method to re-enable features in the scene
  }

  public onWarpSuccess ()
  {
    // Override this method to clean up the scene
  }

  public warpToVerse (verseId: string)
  {
    if (this.isLoadingWarp) {
      console.warn(`Already warping, ignoring warp to ${verseId}`);
      return;
    }

    if (!this.loadVerse) {
      console.error(`No loadVerse function provided for ${verseId}`);
      return;
    }

    this.isLoadingWarp = true;

    try {
      this.onWarpBegin();
    } catch (error) {
      console.error(`Error running onWarpBegin for ${verseId}`, error);
      this.onWarpAbort();
      this.isLoadingWarp = false;
    }

    this.loadVerse!(verseId, this.load)
      .then((verse) => {
        this.onWarpSuccess();
        this.isLoadingWarp = false;

        // FX
        const pixelated = this.cameras.main.postFX.addPixelate(-1);
        
        // Transition to next scene
        this.cameras.main.fadeOut(200)
        this.add.tween({
            targets: pixelated,
            duration: 200,
            amount: 20,
            onComplete: () => {
                this.scene.start('VerseScene', { verseId, verse });
            },
        })
      })
      .catch((error) => {
        console.error(`Error loading verse ${verseId}`, error);
        this.onWarpAbort();
        this.isLoadingWarp = false;
      });
  }
}