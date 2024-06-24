import { connect, result } from "@permaweb/aoconnect";

export type MessageId = string;

export type Message = {
  Target: string;
  Data: string;
};

type BaseAoClient = ReturnType<typeof connect>;

export type AoClient = BaseAoClient;

export type MessageResult = Awaited<ReturnType<typeof result>>;

export type MessageWithResult = {
  messageId: MessageId;
  result: MessageResult;
};
