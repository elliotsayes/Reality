import { AUTO, Game } from 'phaser';
import { Boot } from './scenes/Boot';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { VerseScene } from './scenes/VerseScene';

export const isDebug = import.meta.env.DEV;

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = (parent: string): Phaser.Types.Core.GameConfig => ({
    type: AUTO,
    width: 1024,
    height: 768,
    parent,
    backgroundColor: '#028af8',
    scene: [
        Boot,
        Preloader,
        MainMenu,
        VerseScene,
    ],
    physics: {
        default: 'arcade',
        arcade: { debug: isDebug }
    },
	dom: {
		createContainer: true,
	},
    scale: {
        parent,
        mode: Phaser.Scale.RESIZE,
        resizeInterval: 100,
        width: '100%',
        height: '100%',
        expandParent: true,
    },
    pixelArt: true,
});

const StartGame = (parent: string) => {
    return new Game(config(parent));
}

export default StartGame;
