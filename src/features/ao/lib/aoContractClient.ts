import { AoClient, Message } from "./aoClient";
import { AoWallet } from "./aoWallet";

class AoContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AoContractError";
  }
}

export type ReadArgs = Pick<Parameters<AoClient["dryrun"]>[0], "tags" | "data" | "anchor">

export type SendArgs = Pick<Parameters<AoClient["message"]>[0], "tags" | "data" | "anchor">

export type AoContractClient = {
  processId: string;
  aoClient: AoClient;
  aoWallet: AoWallet;

  dryrunReadReplyOptional: (readArgs: ReadArgs, sender?: string) => Promise<Message | null>;
  dryrunReadReplyOne: (readArgs: ReadArgs, sender?: string) => Promise<Message>;
  dryrunReadReplyOneJson: <T>(readArgs: ReadArgs, sender?: string) => Promise<T>;
  message: (sendArgs: SendArgs) => Promise<string>;
}

export const createAoContractClient = (
  processId: string,
  aoClient: AoClient,
  aoWallet: AoWallet,
) => {
  const dryrunReadReplyOptional = async (readArgs: ReadArgs, sender?: string) => {
    const result = await aoClient.dryrun({
      ...readArgs,
      process: processId,
    });
    const messages = result.Messages as Array<Message>;

    if (messages.length === 0) {
      return null;
    }

    if (sender) {
      const reply = messages.find((msg) => msg.Target === sender);
      if (reply) {
        return reply;
      }
    }

    return messages[0];
  }

  const dryrunReadReplyOne = async (readArgs: ReadArgs, sender?: string) => {
    const reply = await dryrunReadReplyOptional(readArgs, sender);
    if (!reply) {
      throw new AoContractError("No reply");
    }
    return reply;
  }

  const dryrunReadReplyOneJson = async (readArgs: ReadArgs, sender?: string) => {
    const reply = await dryrunReadReplyOne(readArgs, sender);
    return JSON.parse(reply.Data);
  }

  const message = async (sendArgs: SendArgs) => 
    aoClient.message({
      ...sendArgs,
      process: processId,
      signer: aoWallet.signer,
    });

  return {
    processId,
    aoClient,
    aoWallet,

    dryrunReadReplyOptional,
    dryrunReadReplyOne,
    dryrunReadReplyOneJson,
    message,
  }
}