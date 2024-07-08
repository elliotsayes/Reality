import { connect, result } from "@permaweb/aoconnect";

export type MessageId = string;

type BaseAoClient = ReturnType<typeof connect>;

export type AoClient = BaseAoClient;

export type MessageResult = Awaited<ReturnType<typeof result>>;

// export type Message = MessageResult["Messages"][0];
export type Message = {
  Target: string;
  Tags: Array<{
    name: string;
    value: string;
  }>;
  Data: string;
};

export type MessageWithResult = {
  messageId: MessageId;
  result: MessageResult;
};
