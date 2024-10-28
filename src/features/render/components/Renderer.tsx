import { PhaserGame } from "./../components/PhaserGame";
import { ArweaveId } from "@/features/arweave/lib/model";
import { createRealityClientForProcess } from "@/features/reality/contract/realityClient";
import { createChatClientForProcess } from "@/features/chat/contract/chatClient";
import { useNavigate } from "@tanstack/react-router";
import { ProfileRegistryClient } from "@/features/profile/contract/profileRegistryClient";
import { useMachine } from "@xstate/react";
import { renderMachine } from "../machines/renderMachine";
import { Chat } from "@/features/chat/components/Chat";
import { AoContractClientForProcess } from "@/features/ao/lib/aoContractClient";
import { ProfileInfo } from "@/features/profile/contract/model";
import { createTrackingClient } from "@/features/tracking/contract/trackingClient";
import { toast } from "sonner";
import { TokenBalanceOverlay } from "../../token/components/TokenBalanceOverlay";

interface RendererProps {
  userAddress: ArweaveId;
  aoContractClientForProcess: AoContractClientForProcess;
  profileRegistryClient: ProfileRegistryClient;
  trackingClient: ReturnType<typeof createTrackingClient>;
  realityClientForProcess: ReturnType<typeof createRealityClientForProcess>;
  chatClientForProcess: ReturnType<typeof createChatClientForProcess>;
  initialRealityId?: string;
  profileInfo?: ProfileInfo;
}

export function Renderer({
  userAddress,
  aoContractClientForProcess,
  profileRegistryClient,
  trackingClient,
  realityClientForProcess,
  chatClientForProcess,
  initialRealityId,
  profileInfo,
}: RendererProps) {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [current, send] = useMachine(renderMachine, {
    input: {
      playerAddress: userAddress,
      playerProfile: profileInfo,
      initialWorldId: initialRealityId,
      clients: {
        aoContractClientForProcess,
        profileRegistryClient,
        trackingClient,
        realityClientForProcess,
        chatClientForProcess,
      },
      setWorldIdUrl: (worldId: string) => {
        // navigate({
        //   to: `/app/world/${worldId}`,
        // });
      },
      onUnauthorised: () => {
        toast("Unauthorized, please wait for access!");
        navigate({
          to: "/",
        });
      },
    },
    // inspect: (e) => console.debug(e),
  });

  return (
    <div className="relative">
      <div className="absolute left-0 top-0">
        {current.matches({ "In Game": "In Reality Scene" }) &&
          current.context.initialWorldState?.parameters.Token?.Primary && (
            <TokenBalanceOverlay
              aoContractClientForProcess={aoContractClientForProcess}
              userAddress={userAddress}
              tokenId={
                current.context.initialWorldState!.parameters.Token!.Primary!
              }
              schemaFormProcessId={
                current.context.initialWorldState!.parameters.Token.SchemaForm
                  ?.Target
              }
              schemaFormMethod={
                current.context.initialWorldState!.parameters.Token.SchemaForm
                  ?.Id
              }
            />
          )}
      </div>
      <div className="absolute right-0 top-0 bottom-0">
        {current.context.currentWorldId && (
          <Chat
            userAddress={userAddress}
            userProfile={profileInfo}
            chatClient={chatClientForProcess(current.context.currentWorldId!)}
            historyIndex={current.context.initialChatMessageOffset}
            newMessages={current.context.chatMessages}
          />
        )}
      </div>
      <PhaserGame />
    </div>
  );
}
