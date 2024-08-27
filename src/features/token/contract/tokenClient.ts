import { ArweaveAddress, ArweaveId } from "@/features/arweave/lib/model";
import {
  AoContractClient,
  createAoContractClient,
} from "../../ao/lib/aoContractClient";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";
import { TokenBalance, TokenInfo } from "./model";

export type TokenClient = {
  aoContractClient: AoContractClient;

  // Reads
  getInfo(): Promise<TokenInfo>;
  getBalance(address: ArweaveId): Promise<TokenBalance>;
};

// Placeholder
// TODO: Define these methods properly
export const createTokenClient = (
  aoContractClient: AoContractClient,
): TokenClient => ({
  aoContractClient: aoContractClient,

  // Read
  getInfo: async () => {
    const reply = await aoContractClient.dryrunReadReplyOne({
      tags: [{ name: "Action", value: "Info" }],
    });
    return TokenInfo.parse(
      reply.Tags.map((kv) => ({ [kv.name]: kv.value })).reduce(
        (acc, kv) => ({ ...acc, ...kv }),
        {},
      ),
    );
  },
  getBalance: async (address: ArweaveAddress) => {
    return aoContractClient.dryrunReadReplyOneJson<TokenBalance>(
      {
        tags: [
          { name: "Action", value: "Balance" },
          { name: "Recipient", value: address },
        ],
      },
      TokenBalance,
    );
  },
});

export const createTokenClientForProcess =
  (wallet: AoWallet) => (processId: string) => {
    const aoContractClient = createAoContractClient(
      processId,
      connect(),
      wallet,
    );
    return createTokenClient(aoContractClient);
  };
