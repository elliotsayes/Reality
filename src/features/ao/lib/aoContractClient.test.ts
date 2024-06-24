import { describe, expect, test } from "vitest";
import { createAoContractClient } from "./aoContractClient";
import { loadTestWallet } from "../test/lib/fsWallet";
import { connect } from "@permaweb/aoconnect";

describe("createAoContractClient", () => {
  test("creates client", async () => {
    const wallet = await loadTestWallet();

    const aoClient = connect();
    const aoContractClient = createAoContractClient(
      import.meta.env.VITE_READ_PROCESS_ID,
      aoClient,
      wallet,
    );

    expect(aoContractClient).toMatchSnapshot();
  });
});
