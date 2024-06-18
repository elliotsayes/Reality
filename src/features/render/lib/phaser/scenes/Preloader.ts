import { GameObjects } from 'phaser';
import { emitSceneReady } from '../../EventBus';
import { WarpableScene } from './WarpableScene';
import FontFaceObserver from 'fontfaceobserver';

export class Preloader extends WarpableScene
{
    background!: GameObjects.Image;

    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        
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

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(
            camera.width / 2,
            camera.height / 2,
            468,
            32,
        ).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(
            camera.width / 2 - 230,
            camera.height / 2,
            4,
            28,
            0xffffff,
        );

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game
        this.load.setPath('assets');

        // this.load.image('main_bg', 'branding/main_bg.jpg');
        this.load.image('main_logo', 'branding/main_logo_small.png');

        this.load.image('invis', 'sprites/invis.png');
        // this.load.image('mona', 'sprites/mona.png');
        // this.load.image('scream', 'sprites/scream.png');
        this.load.image('speech_sm', 'sprites/speech_sm.png');
        this.load.image('speech_md', 'sprites/speech_md.png');

        // this.load.atlas('faune', 'sprites/atlas/faune.png', 'sprites/atlas/faune.json');

        for (let i = 0; i < 10; i++) {
            const llama_name = `llama_${i}`;
            this.load.spritesheet(llama_name, `sprites/llama/${llama_name}.png`, {
                frameWidth: 24,
                frameHeight: 38,
            });
        }
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        // this.scene.start('MainMenu');
        for (let i = 0; i < 10; i++) {
            const llama_name = `llama_${i}`;
            
            this.anims.create({
                key: `llama_${i}_idle`,
                frameRate: 6,
                frames: this.anims.generateFrameNumbers(llama_name, { start: 7, end: 10 }),
                repeat: -1
            });

            this.anims.create({
                key: `llama_${i}_emote`,
                frameRate: 24,
                frames: this.anims.generateFrameNumbers(llama_name, { start: 7, end: 10 }),
                repeat: -1
            });
        
            this.anims.create({
                key: `${llama_name}_walk`,
                frameRate: 12,
                frames: this.anims.generateFrameNumbers(llama_name, { start: 14, end: 17 }),
                repeat: -1
            });

            this.anims.create({
                key: `${llama_name}_dance`,
                frameRate: 24,
                frames: this.anims.generateFrameNumbers(llama_name, { start: 14, end: 17 }),
                repeat: 3,
            });
        }

        const font = new FontFaceObserver('Press Start 2P');
        font.load().then(() => ((t) => {
            emitSceneReady(t);
        })(this));
    }
}
