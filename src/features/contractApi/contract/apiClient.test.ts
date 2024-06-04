import { describe, test, expect, beforeAll } from "vitest";
import { createApiClient } from "./apiClient";
import { AoContractClient, createAoContractClient } from "@/features/ao/lib/aoContractClient";
import { loadTestWallet } from "@/features/ao/test/lib/fsWallet";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";
import { ApiSchema } from "./model";

describe('createApiClient', () => {
  let testWallet: AoWallet;
  let apiTestAoContractClient: AoContractClient;

  beforeAll(async () => {
    testWallet = await loadTestWallet();
    apiTestAoContractClient = createAoContractClient(import.meta.env.VITE_LLAMAASSISTANT_PROCESS_ID, connect(), testWallet);
  })

  test('creates client', async () => {
    const client = createApiClient(apiTestAoContractClient)
    expect(client).toMatchSnapshot();
  })

  test('read Api', async () => {
    const client = createApiClient(apiTestAoContractClient)

    const api = await client.readApi();
    expect(ApiSchema.safeParse(api).success).toBe(true);
    expect(api).toMatchSnapshot();
  })
})
