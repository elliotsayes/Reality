import { AoContractClient, createAoContractClient } from "../../ao/lib/aoContractClient";
import { ApiSchema } from "./model";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";

export type ApiClient = {
  aoContractClient: AoContractClient;

  // Reads
  readApi(): Promise<ApiSchema>;
}

// Placeholder
// TODO: Define these methods properly
export const createApiClient = (
  aoContractClient: AoContractClient,
): ApiClient => ({
  aoContractClient: aoContractClient,

  // Read
  readApi: () => aoContractClient.dryrunReadReplyOneJson<ApiSchema>({
    tags: [{ name: "Read", value: "Api" }],
  }, /* ApiSchema */),
});

export const createApiClientForProcess = (wallet: AoWallet) => (processId: string) => {
  const aoContractClient = createAoContractClient(processId, connect(), wallet);
  return createApiClient(aoContractClient);
}
