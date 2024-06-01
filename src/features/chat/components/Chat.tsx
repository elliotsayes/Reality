import { ArweaveId } from "@/features/arweave/lib/model";
import { ChatClient } from "../contract/chatClient";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/features/arweave/lib/utils";

interface ChatProps {
  userAddress: ArweaveId;
  chatClient?: ChatClient;
  onUserMessageSent?: () => void;
}

export function Chat({
  userAddress,
  chatClient,
  onUserMessageSent,
}: ChatProps) {

  return (
    <div>
      <h1>Chat</h1>
      <p>User Address: {truncateAddress(userAddress)}</p>
      <p>Chat Client Process Id: {chatClient?.aoContractClient.processId !== undefined
        ? truncateAddress(chatClient?.aoContractClient.processId)
        : "None"}</p>
      <Button
        onClick={onUserMessageSent}
      >
        Fire `onUserMessageSent`
      </Button>
    </div>
  )
}
