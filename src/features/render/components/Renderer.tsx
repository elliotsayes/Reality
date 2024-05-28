import { useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './../components/PhaserGame';
import { MainMenu } from '../lib/phaser/scenes/MainMenu';
import { createVerseClientForProcess } from '@/features/verse/contract/verseClient';
import { WarpableScene } from '../lib/phaser/scenes/WarpableScene';
import { VerseScene } from '../lib/phaser/scenes/VerseScene';
import { createLoadVerse } from '../lib/load/verse';
import { useNavigate } from '@tanstack/react-router';

interface RendererProps {
    verseClientForProcess: ReturnType<typeof createVerseClientForProcess>
    initialVerseId?: string
}

export function Renderer({ verseClientForProcess, initialVerseId }: RendererProps)
{
    const navigate = useNavigate();

    // The sprite can only be moved in the MainMenu Scene
    const [canMoveSprite, setCanMoveSprite] = useState(true);

    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const [spritePosition, setSpritePosition] = useState({ x: 0, y: 0 });

    const [currentScene, setCurrentScene] = useState<WarpableScene>();

    const changeScene = () => {
        if(phaserRef.current)
        {
            // const scene = phaserRef.current.scene as WarpableScene;
            
            if (currentScene)
            {
                let targetVerseId: string;

                const currentSceneKey = currentScene.scene.key;
                const currentVerseId = (currentScene as VerseScene).verseId;
                console.log(`Current scene is ${currentSceneKey}`);
                console.log(`Current verseId is ${currentVerseId}`);
                switch (currentSceneKey)
                {
                    case 'MainMenu':
                        targetVerseId = import.meta.env.VITE_ORIGIN_ISLAND_PROCESS_ID as string;
                        break;
                    case "VerseScene":
                        switch (currentVerseId) {
                            case import.meta.env.VITE_WEAVE_WORLD_PROCESS_ID:
                                targetVerseId = import.meta.env.VITE_ORIGIN_ISLAND_PROCESS_ID;
                                break;
                            case import.meta.env.VITE_ORIGIN_ISLAND_PROCESS_ID:
                                targetVerseId = import.meta.env.VITE_LLAMA_FED_PROCESS_ID;
                                break;
                            default:
                                targetVerseId = import.meta.env.VITE_WEAVE_WORLD_PROCESS_ID as string;
                                break;
                        }
                        break;
                    default:
                        targetVerseId = import.meta.env.VITE_WEAVE_WORLD_PROCESS_ID as string;
                        break;
                }
                console.log(`Changing verseId to ${targetVerseId}`);

                const loadVerse = createLoadVerse(verseClientForProcess(targetVerseId));
                currentScene.warpToVerse(targetVerseId, loadVerse);
            }
        }
    }

    const moveSprite = () => {

        if(phaserRef.current)
        {

            const scene = phaserRef.current.scene as MainMenu;

            if (scene && scene.scene.key === 'MainMenu')
            {
                // Get the update logo position
                scene.moveLogo(({ x, y }) => {

                    setSpritePosition({ x, y });

                });
            }
        }

    }

    const addSprite = () => {

        if (phaserRef.current)
        {
            const scene = phaserRef.current.scene;

            if (scene)
            {
                // Add more stars
                const x = Phaser.Math.Between(64, scene.scale.width - 64);
                const y = Phaser.Math.Between(64, scene.scale.height - 64);
    
                //  `add.sprite` is a Phaser GameObjectFactory method and it returns a Sprite Game Object instance
                const star = scene.add.sprite(x, y, 'star');
    
                //  ... which you can then act upon. Here we create a Phaser Tween to fade the star sprite in and out.
                //  You could, of course, do this from within the Phaser Scene code, but this is just an example
                //  showing that Phaser objects and systems can be acted upon from outside of Phaser itself.
                scene.add.tween({
                    targets: star,
                    duration: 500 + Math.random() * 1000,
                    alpha: 0,
                    yoyo: true,
                    repeat: -1
                });
            }
        }
    }

    // Event emitted from the PhaserGame component
    const updateCurrencScene = (scene: Phaser.Scene) => {
        console.log(`Scene changed to ${scene.scene.key}`);
        setCurrentScene(scene as WarpableScene)
        setCanMoveSprite(scene.scene.key !== 'MainMenu');

        if (scene.scene.key === 'Preloader')
        {
            if (initialVerseId) {
                const loader = createLoadVerse(verseClientForProcess(initialVerseId));
                (scene as WarpableScene).warpToVerse(initialVerseId, loader);
            } else {
                scene.scene.start('MainMenu');
            }
        }

        if (scene.scene.key === 'VerseScene')
        {
            const verseId = (scene as VerseScene).verseId;
            console.log(`Navigating to /verse/${verseId}`);
            navigate({
                to: `/app/verse/${verseId}`,
                replace: true,
            });
        }
    }

    return (
        <div style={{
            width: "100%",
            height: "100vh",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        }}>
            <PhaserGame ref={phaserRef} currentActiveScene={updateCurrencScene} />
            <div>
                <div>
                    <button className="button" onClick={changeScene}>Change Scene</button>
                </div>
                <div>
                    <button disabled={canMoveSprite} className="button" onClick={moveSprite}>Toggle Movement</button>
                </div>
                <div className="spritePosition">Sprite Position:
                    <pre>{`{\n  x: ${spritePosition.x}\n  y: ${spritePosition.y}\n}`}</pre>
                </div>
                <div>
                    <button className="button" onClick={addSprite}>Add New Sprite</button>
                </div>
            </div>
        </div>
    )
}
