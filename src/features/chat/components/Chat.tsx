import { ArweaveId } from "@/features/arweave/lib/model";
import { ChatClient } from "../contract/chatClient";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/features/arweave/lib/utils";
import { useQuery } from "@tanstack/react-query";

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
  const history = useQuery({
    queryKey: ["chat", chatClient?.aoContractClient.processId, "history"],
    queryFn: async () => {
      return await chatClient!.readHistory();
    },
    enabled: chatClient?.aoContractClient.processId !== undefined,
  })

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
      <ul>
        {
          history.isSuccess
            ? Object.entries(history.data).map(([key, value]) => (
              <li key={key}>{truncateAddress(value.Author)}: {value.Content}</li>
            ))
            : <li>Loading...</li>
        }
      </ul>
    </div>
  )
}
