import { AoContractClient, createAoContractClient } from "../../ao/lib/aoContractClient";
import { AoWallet } from "../../ao/lib/aoWallet";
import { ArweaveTxId } from "../../arweave/lib/model";
import { WaitlistState } from "./model";
import { connect } from "@permaweb/aoconnect";

export type WaitlistClient = {
  aoContractClient: AoContractClient;

  // Reads
  readState(): Promise<WaitlistState>;

  // Writes
  register(): Promise<ArweaveTxId>;
  bump(): Promise<ArweaveTxId>;
}

// Placeholder
// TODO: Define these methods properly
export const createWaitlistClient = (
  aoContractClient: AoContractClient,
): WaitlistClient => ({
  aoContractClient: aoContractClient,

  // Reads
  readState: () => aoContractClient.dryrunReadReplyOneJson<WaitlistState>({
    tags: [{ name: "Read", value: "Waitlist-State" }],
  }),

  // Writes
  register: () => aoContractClient.message({
    tags: [{
      name: "Action",
      value: "Waitlist-Register",
    }],
  }),
  bump: () => aoContractClient.message({
    tags: [{
      name: "Action",
      value: "Waitlist-Bump",
    }],
  }), 
});

export const createWaitlistClientForProcess = (wallet: AoWallet) => (processId: string) => {
  const aoContractClient = createAoContractClient(processId, connect(), wallet);
  return createWaitlistClient(aoContractClient);
}

export type WaitlistClientForProcess = ReturnType<typeof createWaitlistClientForProcess>;
