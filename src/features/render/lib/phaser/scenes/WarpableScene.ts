import { Scene } from "phaser";
import { AoContractClientForProcess } from "@/features/ao/lib/aoContractClient";
import { ProfileInfo } from "@/features/profile/contract/model";
import { WorldState } from "../../load/model";
import { WarpTarget } from "../../model";

export class WarpableScene extends Scene {
  public isWarping: boolean = false;

  pixelateIn() {
    this.cameras.main.fadeIn(400);
    const fxCamera = this.cameras.main.postFX.addPixelate(20);
    this.add.tween({
      targets: fxCamera,
      duration: 400,
      amount: -1,
    });
  }

  public onWarpBegin() {
    // Override this method to disable features in the scene
  }

  public onWarpAbort() {
    // Override this method to re-enable features in the scene
  }

  public onWarpSuccess() {
    // Override this method to clean up the scene
  }

  public warpToWorld(
    playerAddress: string,
    playerProfileInfo: ProfileInfo | undefined,
    warpTarget: WarpTarget,
    worldState: WorldState,
    aoContractClientForProcess: AoContractClientForProcess,
  ) {
    console.log({ warpTarget });

    this.onWarpBegin();
    const pixelated = this.cameras.main.postFX.addPixelate(-1);

    // Transition to next scene
    this.add.tween({
      targets: pixelated,
      duration: 200,
      amount: 20,
      onComplete: () => {
        this.onWarpSuccess();
        this.scene.start("WorldScene", {
          playerAddress,
          playerProfileInfo,
          warpTarget,
          reality: worldState,
          aoContractClientForProcess,
        });
      },
    });
  }
}
