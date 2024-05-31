import { PhaserGame } from './../components/PhaserGame';
import { createVerseClientForProcess } from '@/features/verse/contract/verseClient';
import { useNavigate } from '@tanstack/react-router';
import { ProfileClient } from '@/features/profile/contract/profileClient';
import { useMachine } from '@xstate/react';
import { renderMachine } from '../machines/renderMachine';

interface RendererProps {
    profileClient: ProfileClient
    verseClientForProcess: ReturnType<typeof createVerseClientForProcess>
    verseId?: string
}

export function Renderer({ profileClient, verseClientForProcess, verseId: verseIdProp }: RendererProps) {
    const navigate = useNavigate();
    useMachine(renderMachine, {
        input: {
            initialVerseId: verseIdProp,
            clients: {
                profileClient,
                verseClientForProcess,
            },
            setVerseIdUrl: (verseId: string) => {
                navigate({
                    to: `/app/verse/${verseId}`,
                });
            },
        },
        inspect: (e) => console.log(e),
    });

    return (
        <PhaserGame />
    )
}
