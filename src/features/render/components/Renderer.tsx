import { PhaserGame } from './../components/PhaserGame';
import { ArweaveId } from '@/features/arweave/lib/model';
import { createVerseClientForProcess } from '@/features/verse/contract/verseClient';
import { createChatClientForProcess } from '@/features/chat/contract/chatClient';
import { useNavigate } from '@tanstack/react-router';
import { ProfileClient } from '@/features/profile/contract/profileClient';
import { useMachine } from '@xstate/react';
import { renderMachine } from '../machines/renderMachine';
import { Chat } from '@/features/chat/components/Chat';
import { AoContractClientForProcess } from '@/features/ao/lib/aoContractClient';

interface RendererProps {
    userAddress: ArweaveId
    aoContractClientForProcess: AoContractClientForProcess
    profileClient: ProfileClient
    verseClientForProcess: ReturnType<typeof createVerseClientForProcess>
    chatClientForProcess: ReturnType<typeof createChatClientForProcess>
    verseId?: string
}

export function Renderer({ userAddress, aoContractClientForProcess, profileClient, verseClientForProcess, chatClientForProcess, verseId: verseIdProp }: RendererProps) {
    const navigate = useNavigate();
    const [current, send] = useMachine(renderMachine, {
        input: {
            playerAddress: userAddress,
            initialVerseId: verseIdProp,
            clients: {
                aoContractClientForProcess,
                profileClient,
                verseClientForProcess,
                chatClientForProcess,
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
            <div className='absolute right-0 top-0 bottom-0'>
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
