import { describe, test, expect, beforeAll } from "vitest";
import { createTrackingClient } from "./trackingClient";
import {
  AoContractClient,
  createAoContractClient,
} from "@/features/ao/lib/aoContractClient";
import { loadTestWallet } from "@/features/ao/test/lib/fsWallet";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";

describe("createTrackingClient", () => {
  let testWallet: AoWallet;
  let trackingTestAoContractClient: AoContractClient;

  beforeAll(async () => {
    testWallet = await loadTestWallet();
    trackingTestAoContractClient = createAoContractClient(
      import.meta.env.VITE_TRACKING_TEST_PROCESS_ID,
      connect(),
      testWallet,
    );
  });

  test("creates client", async () => {
    const client = createTrackingClient(trackingTestAoContractClient);
    expect(client).toMatchSnapshot();
  });

  test("read Login", async () => {
    const client = createTrackingClient(trackingTestAoContractClient);

    const login = await client.login();
    console.log(login);
  });
});
