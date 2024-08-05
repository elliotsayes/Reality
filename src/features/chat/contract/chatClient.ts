import { MessageId } from "../../ao/lib/aoClient";
import {
  AoContractClient,
  createAoContractClient,
} from "../../ao/lib/aoContractClient";
import { ChatMessageCreate, ChatMessageHistory } from "./model";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";

type HistoryQuery = {
  idAfter?: number;
  idBefore?: number;
  timeStart?: Date;
  timeEnd?: Date;
  limit?: number;
};

export type ChatClient = {
  aoContractClient: AoContractClient;

  // Reads
  readCount(): Promise<number>;
  readHistory(query?: HistoryQuery): Promise<ChatMessageHistory>;

  // Writes
  postMessage(message: ChatMessageCreate): Promise<MessageId>;
};

// Placeholder
// TODO: Define these methods properly
export const createChatClient = (
  aoContractClient: AoContractClient,
): ChatClient => ({
  aoContractClient: aoContractClient,

  // Read
  readCount: () =>
    aoContractClient
      .dryrunReadReplyOne({
        tags: [{ name: "Action", value: "ChatCount" }],
      })
      .then((reply) => parseInt(reply.Data)),
  readHistory: (query?: HistoryQuery) => {
    const queryTagsMap = {
      "Id-After": query?.idAfter?.toString(),
      "Id-Before": query?.idBefore?.toString(),
      "Timestamp-Start": query?.timeStart?.getTime().toString(),
      "Timestamp-End": query?.timeEnd?.getTime().toString(),
      Limit: query?.limit?.toString(),
    };
    const filterTags = Object.entries(queryTagsMap)
      .filter(([, value]) => value !== undefined)
      .map(([name, value]) => ({ name, value: value! }));
    const tags = filterTags.concat({ name: "Action", value: "ChatHistory" });

    return aoContractClient.dryrunReadReplyOneJson<ChatMessageHistory>({
      tags,
    });
  },

  // Write
  postMessage: (chatMessage: ChatMessageCreate) =>
    aoContractClient.message({
      tags: [
        {
          name: "Action",
          value: "ChatMessage",
        },
        {
          name: "Author-Name",
          value: chatMessage.AuthorName,
        },
      ],
      data: chatMessage.Content,
    }),
});

export const createChatClientForProcess =
  (wallet: AoWallet) => (processId: string) => {
    const aoContractClient = createAoContractClient(
      processId,
      connect(),
      wallet,
    );
    return createChatClient(aoContractClient);
  };

export type ChatClientForProcess = ReturnType<
  typeof createChatClientForProcess
>;
