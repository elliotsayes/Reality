import { GameObjects } from 'phaser';

import ReactDOM from 'react-dom/client';
import { WarpableScene } from './WarpableScene';
import { emitSceneEvent, emitSceneReady } from '../../EventBus';
import { ButtonOnce } from '@/features/render/components/ButtonOnce';
import { ElementSize } from '../../model';

export class MainMenu extends WarpableScene
{
    background!: GameObjects.Image;
    logo!: GameObjects.Image;
    title!: GameObjects.Text;
    logoTween!: Phaser.Tweens.Tween | null;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const camera = this.cameras.main;

        const bgSize = [1252, 627];
        this.background = this.add.image(
            camera.width / 2,
            camera.height / 2,
            'main_bg',
        )
            .setScale(
                camera.width / bgSize[0], 
                camera.height / bgSize[1],
            );

        this.logo = this.add.image(
            camera.width / 2,
            camera.height / 2 - 100,
            'main_logo',
        ).setDepth(100);

        const buttonSize: ElementSize = {
            w: 300,
            h: 50,
        }
        const memElement = document.createElement("div");
        const cb = () => emitSceneEvent({
            type: 'Warp Immediate',
            verseId: import.meta.env.VITE_ORIGIN_ISLAND_PROCESS_ID,
        })
        
        memElement.setAttribute('style', `width: ${buttonSize.w}px; height: ${buttonSize.h}px; display: flex; justify-content: center; align-items: center;`)
        ReactDOM.createRoot(memElement).render(
            <ButtonOnce
                elementSize={buttonSize}
                onClick={cb}
                children="Warp to Origin Island"
            />
        );

        this.add.dom(
            camera.width / 2,
            camera.height / 2 + 100,
            memElement,
        ).setOrigin(0.5);

        emitSceneReady(this);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cleanUp() {
        if (this.logoTween)
        {
            this.logoTween.stop();
            this.logoTween = null;
        }
    }

    onWarpSuccess() {
        this.cleanUp();
    }

    moveLogo (vueCallback: ({ x, y }: { x: number, y: number }) => void)
    {
        if (this.logoTween)
        {
            if (this.logoTween.isPlaying())
            {
                this.logoTween.pause();
            }
            else
            {
                this.logoTween.play();
            }
        } 
        else
        {
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: { value: 750, duration: 3000, ease: 'Back.easeInOut' },
                y: { value: 80, duration: 1500, ease: 'Sine.easeOut' },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (vueCallback)
                    {
                        vueCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y)
                        });
                    }
                }
            });
        }
    }
}
