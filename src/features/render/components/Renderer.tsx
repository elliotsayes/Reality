import { PhaserGame } from "./../components/PhaserGame";
import { ArweaveId } from "@/features/arweave/lib/model";
import { createVerseClientForProcess } from "@/features/verse/contract/verseClient";
import { createChatClientForProcess } from "@/features/chat/contract/chatClient";
import { useNavigate } from "@tanstack/react-router";
import { ProfileRegistryClient } from "@/features/profile/contract/profileRegistryClient";
import { useMachine } from "@xstate/react";
import { renderMachine } from "../machines/renderMachine";
import { Chat } from "@/features/chat/components/Chat";
import { AoContractClientForProcess } from "@/features/ao/lib/aoContractClient";
import { ProfileInfo } from "@/features/profile/contract/model";

interface RendererProps {
  userAddress: ArweaveId;
  aoContractClientForProcess: AoContractClientForProcess;
  profileRegistryClient: ProfileRegistryClient;
  verseClientForProcess: ReturnType<typeof createVerseClientForProcess>;
  chatClientForProcess: ReturnType<typeof createChatClientForProcess>;
  initialVerseId?: string;
  profileInfo?: ProfileInfo;
}

export function Renderer({
  userAddress,
  aoContractClientForProcess,
  profileRegistryClient,
  verseClientForProcess,
  chatClientForProcess,
  initialVerseId,
  profileInfo,
}: RendererProps) {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [current, send] = useMachine(renderMachine, {
    input: {
      playerAddress: userAddress,
      playerProfile: profileInfo,
      initialVerseId,
      clients: {
        aoContractClientForProcess,
        profileRegistryClient: profileRegistryClient,
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
    <div className="relative">
      <div className="absolute right-0 top-0 bottom-0">
        {current.context.currentVerseId && (
          <Chat
            userAddress={userAddress}
            chatClient={chatClientForProcess(current.context.currentVerseId!)}
            historyIndex={current.context.initialChatMessageOffset}
            newMessages={current.context.chatMessages}
          />
        )}
      </div>
      <PhaserGame />
    </div>
  );
}
