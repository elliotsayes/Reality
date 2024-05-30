import { useEffect, useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './../components/PhaserGame';
import { MainMenu } from '../lib/phaser/scenes/MainMenu';
import { createVerseClientForProcess } from '@/features/verse/contract/verseClient';
import { WarpableScene } from '../lib/phaser/scenes/WarpableScene';
import { VerseScene } from '../lib/phaser/scenes/VerseScene';
import { useNavigate } from '@tanstack/react-router';
import { createLoadVerseForProcess } from '../lib/load/verse';
import { createProfileClientForProcess } from '@/features/profile/contract/profileClient';

interface RendererProps {
    verseClientForProcess: ReturnType<typeof createVerseClientForProcess>
    profileClientForProcess: ReturnType<typeof createProfileClientForProcess>
    verseId?: string
}

export function Renderer({ verseClientForProcess, profileClientForProcess, verseId: verseIdParam }: RendererProps)
{
    const navigate = useNavigate();

    const [lastVerseIdParam, setLastVerseIdParam] = useState<string | undefined>(verseIdParam);
    useEffect(() => {
        setLastVerseIdParam(verseIdParam);
    }, [verseIdParam]);
    const [lastNavigatedVerseId, setLastNavigatedVerseId] = useState<string | undefined>(verseIdParam);


    const [currentScene, setCurrentScene] = useState<WarpableScene>();

    useEffect(() => {
        if (verseIdParam !== undefined && verseIdParam !== lastNavigatedVerseId && verseIdParam !== lastVerseIdParam) {
            if (currentScene) {
                const targetVerseId = verseIdParam;
                currentScene.warpToVerse(targetVerseId);
            }
        }
    }, [verseIdParam, lastNavigatedVerseId, lastVerseIdParam, currentScene, verseClientForProcess]);

    // Event emitted from the PhaserGame component
    const updateCurrentScene = (scene: Phaser.Scene) => {
        console.log(`Scene changed to ${scene.scene.key}`);
        setCurrentScene(scene as WarpableScene)

        if (scene.scene.key === 'Preloader' || scene.scene.key === 'MainMenu' || scene.scene.key === 'VerseScene')
        {
            (scene as MainMenu).setLoadVerse(createLoadVerseForProcess(verseClientForProcess, profileClientForProcess))
        }

        if (scene.scene.key === 'Preloader')
        {
            if (verseIdParam) {
                (scene as WarpableScene).warpToVerse(verseIdParam);
            } else {
                scene.scene.start('MainMenu');
            }
        }

        if (scene.scene.key === 'VerseScene')
        {
            const verseId = (scene as VerseScene).verseId;
            console.log(`Navigating to /verse/${verseId}`);
            setLastNavigatedVerseId(verseId)
            navigate({
                to: `/app/verse/${verseId}`,
            });
        }
    }

    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    return (
        <div>
            <PhaserGame ref={phaserRef} currentActiveScene={updateCurrentScene} />
        </div>
    )
}
