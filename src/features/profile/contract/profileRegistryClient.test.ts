import { describe, test, expect, beforeAll } from "vitest";
import { createProfileRegistryClient } from "./profileRegistryClient";
import {
  AoContractClient,
  createAoContractClient,
} from "@/features/ao/lib/aoContractClient";
import { loadTestWallet } from "@/features/ao/test/lib/fsWallet";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";

describe("createProfileRegistryClient", () => {
  let testWallet: AoWallet;
  let profileTestAoContractClient: AoContractClient;

  beforeAll(async () => {
    testWallet = await loadTestWallet();
    profileTestAoContractClient = createAoContractClient(
      import.meta.env.VITE_PROFILETEST_PROCESS_ID,
      connect(),
      testWallet,
    );
  });

  test("creates client", async () => {
    const client = createProfileRegistryClient(profileTestAoContractClient);
    expect(client).toMatchSnapshot();
  });
});
