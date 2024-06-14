import { MessageId } from "../../ao/lib/aoClient";
import { AoContractClient, createAoContractClient } from "../../ao/lib/aoContractClient";
import { Message, MessageCreate } from "./model";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";

export type ChatClient = {
  aoContractClient: AoContractClient;

  // Reads
  readHistory(): Promise<Array<Message>>;

  // Writes
  postMessage(message: MessageCreate): Promise<MessageId>;
}

// Placeholder
// TODO: Define these methods properly
export const createChatClient = (
  aoContractClient: AoContractClient,
): ChatClient => ({
  aoContractClient: aoContractClient,

  // Read
  readHistory: () => aoContractClient.dryrunReadReplyOneJson<Array<Message>>({
    tags: [{ name: "Action", value: "ChatHistory" }],
    data: JSON.stringify({}),
  }, /* ChatInfoKeyed */),

  // Write
  postMessage: (chat: MessageCreate) => aoContractClient.message({
    tags: [{
      name: "Action",
      value: "ChatMessage",
    }, {
      name: "Author-Name",
      value: chat.AuthorName,
    }],
    data: chat.Content,
  }),
});

export const createChatClientForProcess = (wallet: AoWallet) => (processId: string) => {
  const aoContractClient = createAoContractClient(processId, connect(), wallet);
  return createChatClient(aoContractClient);
}
