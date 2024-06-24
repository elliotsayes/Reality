import { describe, test, expect, beforeAll } from "vitest";
import { createSchemaClient } from "./schemaClient";
import {
  AoContractClient,
  createAoContractClient,
} from "@/features/ao/lib/aoContractClient";
import { loadTestWallet } from "@/features/ao/test/lib/fsWallet";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";
import { Schema } from "./model";

describe("createSchemaClient", () => {
  let testWallet: AoWallet;
  let schemaTestAoContractClient: AoContractClient;

  beforeAll(async () => {
    testWallet = await loadTestWallet();
    schemaTestAoContractClient = createAoContractClient(
      import.meta.env.VITE_LLAMAASSISTANT_PROCESS_ID,
      connect(),
      testWallet,
    );
  });

  test("creates client", async () => {
    const client = createSchemaClient(schemaTestAoContractClient);
    expect(client).toMatchSnapshot();
  });

  test("read Schema", async () => {
    const client = createSchemaClient(schemaTestAoContractClient);

    const schema = await client.readSchema();
    expect(Schema.safeParse(schema).success).toBe(true);
    expect(schema).toMatchSnapshot();
  });
});
