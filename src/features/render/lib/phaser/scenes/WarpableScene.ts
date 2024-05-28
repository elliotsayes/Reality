
import { Scene } from 'phaser';
import { LoadVerse } from '../../load/verse';

export class WarpableScene extends Scene
{
  public isLoadingWarp: boolean = false;

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

  public warpToVerse (verseId: string, loadVerse: LoadVerse)
  {
    if (this.isLoadingWarp) {
      console.warn(`Already warping, ignoring warp to ${verseId}`);
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

    loadVerse(this.load)
      .then((verse) => {
        this.onWarpSuccess();
        this.isLoadingWarp = false;
        this.scene.start("VerseScene", { verseId, verse });
      })
      .catch((error) => {
        console.error(`Error loading verse ${verseId}`, error);
        this.onWarpAbort();
        this.isLoadingWarp = false;
      });
  }
}