import { GameObjects } from "phaser";

import ReactDOM from "react-dom/client";
import { WarpableScene } from "./WarpableScene";
import { emitSceneEvent, emitSceneReady } from "../../EventBus";
import { ButtonOnce } from "@/features/render/components/ButtonOnce";
import { Size2D } from "../../model";
import { LoginResult } from "@/features/tracking/contract/model";
import { toast } from "sonner";

export class MainMenu extends WarpableScene {
  background!: GameObjects.Image;
  logo!: GameObjects.Image;
  title!: GameObjects.Text;
  logoTween!: Phaser.Tweens.Tween | null;

  warpButton!: GameObjects.DOMElement;

  constructor() {
    super("MainMenu");
  }

  create() {
    const camera = this.cameras.main;

    const bgSize = [1252, 627];
    this.background = this.add
      .image(camera.width / 2, camera.height / 2, "main_bg")
      .setScale(camera.width / bgSize[0], camera.height / bgSize[1]);

    this.logo = this.add
      .image(camera.width / 2, camera.height / 2 - 100, "main_logo")
      .setDepth(100);

    const buttonSize: Size2D = {
      w: 300,
      h: 50,
    };
    const memElement = document.createElement("div");
    memElement.setAttribute(
      "style",
      `width: ${buttonSize.w}px; height: ${buttonSize.h}px; display: flex; justify-content: center; align-items: center;`,
    );

    const cb = () =>
      emitSceneEvent({
        type: "Warp Immediate",
        verseId: import.meta.env.VITE_LLAMA_LAND_PROCESS_ID,
      });
    ReactDOM.createRoot(memElement).render(
      <ButtonOnce
        elementSize={buttonSize}
        onClick={cb}
        children="Login to Llama Land"
      />,
    );

    this.warpButton = this.add
      .dom(camera.width / 2, camera.height / 2 + 100, memElement)
      .setOrigin(0.5);

    emitSceneReady(this);
  }

  showLoginResult(loginResult: LoginResult) {
    console.log("MainMenu.showLoginResult", loginResult);
    if (!loginResult.HasReward) {
      toast(
        loginResult.Message === "No Reward"
          ? "Daily reward already claimed :)"
          : loginResult.Message,
      );
      return;
    }

    this.warpButton.destroy();

    // bottom
    const startPosition = {
      x: this.cameras.main.width / 2,
      y: this.cameras.main.height + 200,
    };
    const center = {
      x: this.cameras.main.width / 2,
      y: this.cameras.main.height / 2,
    };

    // reduce logo to half opacity
    this.tweens.add({
      targets: this.logo,
      alpha: 0.5,
      duration: 1000,
    });

    // create big llama
    const llama = this.add
      .sprite(startPosition.x, startPosition.y, "llama_0")
      .setScale(4);
    llama.play("llama_0_idle");
    llama.setDepth(100);
    // move him up to the middle
    this.tweens.add({
      targets: llama,
      x: center.x,
      y: center.y,
      duration: 4000,
      ease: "Back.easeOut",
    });

    const numberOfCoins = (loginResult.Reward ?? 0) / Math.pow(10, 12);
    const showCoins = Math.min(numberOfCoins, 10);
    // create coins around the edge of the screen
    for (let i = 0; i < showCoins; i++) {
      const coin = this.add
        .image(
          this.cameras.main.width / 2 + Math.cos(i) * this.cameras.main.width,
          this.cameras.main.height / 2 + Math.sin(i) * this.cameras.main.height,
          "coin_icon",
        )
        .setScale(0.5);
      this.tweens.add({
        targets: coin,
        x: center.x,
        y: center.y,
        duration: 2000,
        ease: "Back.easeOut",
        delay: 1000 + i * 200,
      });
    }

    const messageText = loginResult.Message;
    const llamaQuantityText = `Recieved ${numberOfCoins} $LLAMA coin!`;
    // After delay, animate in the message & quantity above the Llama sprite
    this.time.delayedCall(4000, () => {
      // allow for two lines
      const message = this.add
        .text(center.x, center.y - 200, messageText, {
          fontFamily: "'Press Start 2P'",
          fontSize: "18px",
          color: "#fff",
          align: "center",
        })
        .setOrigin(0.5)
        .setDepth(100);
      const llamaQuantity = this.add
        .text(center.x, center.y - 150, llamaQuantityText, {
          fontFamily: "'Press Start 2P'",
          fontSize: "24px",
          color: "#fff",
          align: "center",
        })
        .setOrigin(0.5)
        .setDepth(100);

      // fade the text out slightly
      this.tweens.add({
        targets: [message, llamaQuantity],
        alpha: 0.5,
        duration: 1000,
        delay: 2000,
      });
    });

    // Add a button to warp in
    this.time.delayedCall(4000, () => {
      const memElement = document.createElement("div");
      memElement.setAttribute(
        "style",
        `width: 300px; height: 50px; display: flex; justify-content: center; align-items: center;`,
      );

      const cb = () =>
        emitSceneEvent({
          type: "Warp Immediate",
          verseId: import.meta.env.VITE_LLAMA_LAND_PROCESS_ID,
        });
      ReactDOM.createRoot(memElement).render(
        <ButtonOnce
          elementSize={{ w: 300, h: 50 }}
          onClick={cb}
          children="Enter Llama Land"
        />,
      );

      this.add
        .dom(center.x, center.y + 200, memElement)
        .setOrigin(0.5)
        .setDepth(100);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cleanUp() {
    if (this.logoTween) {
      this.logoTween.stop();
      this.logoTween = null;
    }
  }

  onWarpSuccess() {
    this.cleanUp();
  }

  moveLogo(vueCallback: ({ x, y }: { x: number; y: number }) => void) {
    if (this.logoTween) {
      if (this.logoTween.isPlaying()) {
        this.logoTween.pause();
      } else {
        this.logoTween.play();
      }
    } else {
      this.logoTween = this.tweens.add({
        targets: this.logo,
        x: { value: 750, duration: 3000, ease: "Back.easeInOut" },
        y: { value: 80, duration: 1500, ease: "Sine.easeOut" },
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          if (vueCallback) {
            vueCallback({
              x: Math.floor(this.logo.x),
              y: Math.floor(this.logo.y),
            });
          }
        },
      });
    }
  }
}
