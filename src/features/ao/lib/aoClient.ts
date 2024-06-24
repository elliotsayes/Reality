import { connect } from "@permaweb/aoconnect";

export type MessageId = string;

export type Message = {
  Target: string;
  Data: string;
};

type BaseAoClient = ReturnType<typeof connect>;

export type AoClient = BaseAoClient;
