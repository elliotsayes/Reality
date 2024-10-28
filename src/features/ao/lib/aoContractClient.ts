import { z } from "zod";
import { AoClient, Message, MessageResult } from "./aoClient";
import { AoWallet } from "./aoWallet";
import { connect } from "@permaweb/aoconnect";

export class AoContractError extends Error {
  error: unknown | undefined;

  constructor(message: string, error?: unknown) {
    super(message);
    this.name = "AoContractError";
    this.error = error;
  }
}

export type ReadArgs = Pick<
  Parameters<AoClient["dryrun"]>[0],
  "tags" | "data" | "anchor"
>;

export type SendArgs = Pick<
  Parameters<AoClient["message"]>[0],
  "tags" | "data" | "anchor"
>;

export type AoContractClient = {
  processId: string;
  aoClient: AoClient;
  aoWallet: AoWallet;

  dryrunReadReplyOptional: (readArgs: ReadArgs) => Promise<Message | undefined>;
  dryrunReadReplyOptionalJson: <T>(
    readArgs: ReadArgs,
    schema?: z.Schema,
  ) => Promise<T | undefined>;
  dryrunReadReplyOne: (readArgs: ReadArgs) => Promise<Message>;
  dryrunReadReplyOneJson: <T>(
    readArgs: ReadArgs,
    schema?: z.Schema,
  ) => Promise<T>;
  message: (sendArgs: SendArgs) => Promise<string>;
  messageResult: (sendArgs: SendArgs) => Promise<MessageResult>;
  messageDelayReplyOptional: (
    sendArgs: SendArgs,
  ) => Promise<Message | undefined>;
  messageDelayReplyOne: (sendArgs: SendArgs) => Promise<Message>;
  messageDelayReplyOneJson: <T>(
    sendArgs: SendArgs,
    schema?: z.Schema,
  ) => Promise<T>;
};

export const createAoContractClient = (
  processId: string,
  aoClient: AoClient,
  aoWallet: AoWallet,
): AoContractClient => {
  const dryrunReadReplyOptional = async (readArgs: ReadArgs) => {
    const result = await aoClient.dryrun({
      ...readArgs,
      process: processId,
      Target: processId,
      Owner: aoWallet.address,
    });
    const messages = result.Messages as Array<Message>;

    if (messages.length === 0) {
      return undefined;
    }

    const reply = messages.find((msg) => msg.Target === aoWallet.address);
    return reply;
  };

  const dryrunReadReplyOptionalJson = async (
    readArgs: ReadArgs,
    schema?: z.Schema,
  ) => {
    const reply = await dryrunReadReplyOptional(readArgs);
    if (!reply) {
      return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let json: any;
    try {
      json = JSON.parse(reply.Data);
    } catch (error) {
      return undefined;
    }
    if (schema) {
      const result = schema.safeParse(json);
      if (!result.success) {
        return undefined;
      }
    }
    return json;
  };

  const dryrunReadReplyOne = async (readArgs: ReadArgs) => {
    const reply = await dryrunReadReplyOptional(readArgs);
    if (!reply) {
      throw new AoContractError("No reply");
    }
    return reply;
  };

  const dryrunReadReplyOneJson = async (
    readArgs: ReadArgs,
    schema?: z.Schema,
  ) => {
    const reply = await dryrunReadReplyOne(readArgs);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let json: any;
    try {
      json = JSON.parse(reply.Data);
    } catch (error) {
      throw new AoContractError("Invalid JSON", error);
    }
    if (schema) {
      const result = schema.safeParse(json);
      if (!result.success) {
        throw new AoContractError("JSON does not match schema", result.error);
      }
    }
    return json;
  };

  const message = async (sendArgs: SendArgs) =>
    aoClient.message({
      ...sendArgs,
      process: processId,
      signer: aoWallet.signer,
    });

  const messageResult = async (sendArgs: SendArgs) => {
    const messageId = await aoClient.message({
      ...sendArgs,
      process: processId,
      signer: aoWallet.signer,
    });
    // TODO: Call this in a loop?
    const result = await aoClient.result({
      message: messageId,
      process: processId,
    });
    return result;
  };

  const messageDelayReplyOptional = async (
    sendArgs: SendArgs,
    cooldownMs = 100,
    attempts = 50,
  ) => {
    // Get the cursor for the most recent result
    const latest = await aoClient.results({
      process: processId,
      limit: 1,
      sort: "DESC",
    });
    let latestCursor: string | undefined = undefined;
    if (latest.edges.length > 0) {
      latestCursor = latest.edges[0].cursor;
    }

    // Send the message
    await aoClient.message({
      ...sendArgs,
      process: processId,
      signer: aoWallet.signer,
    });

    // Iterate through results to find our reply
    let lastCursor = latestCursor;
    for (let i = 0; i < attempts; i++) {
      const pollResult = await aoClient.results({
        process: processId,
        from: lastCursor,
        sort: "ASC",
      });
      for (let j = 0; j < pollResult.edges.length; j++) {
        const edge = pollResult.edges[j];
        for (let k = 0; k < edge.node.Messages.length; k++) {
          const msg = edge.node.Messages[k];
          if (msg.Target === aoWallet.address) {
            return msg;
          }
        }
      }
      // Update cursor so we don't get the same results again
      if (pollResult.edges.length > 0)
        lastCursor = pollResult.edges[pollResult.edges.length - 1].cursor;

      // Try again...
      await new Promise((resolve) => setTimeout(resolve, cooldownMs));
    }

    return undefined;
  };

  const messageDelayReplyOne = async (sendArgs: SendArgs) => {
    const reply = await messageDelayReplyOptional(sendArgs);
    if (reply === undefined) {
      throw new AoContractError("No reply");
    }
    return reply;
  };

  const messageDelayReplyOneJson = async (
    readArgs: ReadArgs,
    schema?: z.Schema,
  ) => {
    const reply = await messageDelayReplyOne(readArgs);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let json: any;
    try {
      json = JSON.parse(reply.Data);
    } catch (error) {
      throw new AoContractError("Invalid JSON", error);
    }
    if (schema) {
      const result = schema.safeParse(json);
      if (!result.success) {
        throw new AoContractError("JSON does not match schema", result.error);
      }
    }
    return json;
  };

  return {
    processId,
    aoClient,
    aoWallet,

    dryrunReadReplyOptional,
    dryrunReadReplyOptionalJson,
    dryrunReadReplyOne,
    dryrunReadReplyOneJson,
    message,
    messageResult,
    messageDelayReplyOptional,
    messageDelayReplyOne,
    messageDelayReplyOneJson,
  };
};

export const createAoContractClientForProcess =
  (wallet: AoWallet) => (processId: string) => {
    const aoClient = connect();
    return createAoContractClient(processId, aoClient, wallet);
  };
export type AoContractClientForProcess = ReturnType<
  typeof createAoContractClientForProcess
>;
