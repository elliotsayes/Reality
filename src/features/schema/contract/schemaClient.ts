import { AoContractClient, createAoContractClient } from "../../ao/lib/aoContractClient";
import { Schema, SchemaExternal } from "./model";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";

export type SchemaClient = {
  aoContractClient: AoContractClient;

  // Reads
  readSchema(): Promise<Schema>;
  readSchemaExternal(): Promise<SchemaExternal>;
}

// Placeholder
// TODO: Define these methods properly
export const createSchemaClient = (
  aoContractClient: AoContractClient,
): SchemaClient => ({
  aoContractClient: aoContractClient,

  // Read
  readSchema: () => aoContractClient.dryrunReadReplyOneJson<Schema>({
    tags: [{ name: "Read", value: "Schema" }],
  }, /* Schema */),
  readSchemaExternal: () => aoContractClient.dryrunReadReplyOneJson<SchemaExternal>({
    tags: [{ name: "Read", value: "SchemaExternal" }],
  }, /* SchemaExternal */),
});

export const createSchemaClientForProcess = (wallet: AoWallet) => (processId: string) => {
  const aoContractClient = createAoContractClient(processId, connect(), wallet);
  return createSchemaClient(aoContractClient);
}
