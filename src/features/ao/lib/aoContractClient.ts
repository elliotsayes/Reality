import { z } from "zod";
import { AoClient, Message } from "./aoClient";
import { AoWallet } from "./aoWallet";
import { connect } from "@permaweb/aoconnect";

class AoContractError extends Error {
  error: unknown | undefined;

  constructor(message: string, error?: unknown) {
    super(message);
    this.name = "AoContractError";
    this.error = error;
  }
}

export type ReadArgs = Pick<Parameters<AoClient["dryrun"]>[0], "tags" | "data" | "anchor">

export type SendArgs = Pick<Parameters<AoClient["message"]>[0], "tags" | "data" | "anchor">

export type AoContractClient = {
  processId: string;
  aoClient: AoClient;
  aoWallet: AoWallet;

  dryrunReadReplyOptional: (readArgs: ReadArgs) => Promise<Message | undefined>;
  dryrunReadReplyOne: (readArgs: ReadArgs) => Promise<Message>;
  dryrunReadReplyOneJson: <T>(readArgs: ReadArgs, schema?: z.Schema) => Promise<T>;
  message: (sendArgs: SendArgs) => Promise<string>;
}

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
  }

  const dryrunReadReplyOne = async (readArgs: ReadArgs) => {
    const reply = await dryrunReadReplyOptional(readArgs);
    if (!reply) {
      throw new AoContractError("No reply");
    }
    return reply;
  }

  const dryrunReadReplyOneJson = async (readArgs: ReadArgs, schema?: z.Schema) => {
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
      return result.data;
    }
    return json;
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

export const createAoContractClientForProcess = (wallet: AoWallet) => (processId: string) => {
  const aoClient = connect();
  return createAoContractClient(processId, aoClient, wallet);
}
export type AoContractClientForProcess = ReturnType<typeof createAoContractClientForProcess>;
