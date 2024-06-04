import { PhaserGame } from './../components/PhaserGame';
import { ArweaveId } from '@/features/arweave/lib/model';
import { createVerseClientForProcess } from '@/features/verse/contract/verseClient';
import { createChatClientForProcess } from '@/features/chat/contract/chatClient';
import { useNavigate } from '@tanstack/react-router';
import { ProfileClient } from '@/features/profile/contract/profileClient';
import { useMachine } from '@xstate/react';
import { renderMachine } from '../machines/renderMachine';
import { Chat } from '@/features/chat/components/Chat';

interface RendererProps {
    userAddress: ArweaveId
    profileClient: ProfileClient
    verseClientForProcess: ReturnType<typeof createVerseClientForProcess>
    chatClientForProcess: ReturnType<typeof createChatClientForProcess>
    verseId?: string
}

export function Renderer({ userAddress, profileClient, verseClientForProcess, chatClientForProcess, verseId: verseIdProp }: RendererProps) {
    const navigate = useNavigate();
    const [current, send] = useMachine(renderMachine, {
        input: {
            playerAddress: userAddress,
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
        inspect: (e) => console.debug(e),
    });

    return (
        <div className='relative'>
            <div className='hidden right-0 top-0 bottom-0'>
                <Chat
                    userAddress={userAddress}
                    chatClient={current.context.currentVerseId
                            ? chatClientForProcess(current.context.currentVerseId!)
                            : undefined}
                />
            </div>
            <PhaserGame />
        </div>
    )
}
