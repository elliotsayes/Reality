import { describe, test, expect } from "vitest";
import { createFsWallet, loadTestWallet } from "./fsWallet";

describe("createFsWallet", () => {
  test("loads jwk", async () => {
    const wallet = await createFsWallet("./fixtures/test_jwk.json")({
      permissionsRequested: [],
    });
    expect(wallet.success).toBe(true);
    expect(wallet).toMatchSnapshot();
  });
});

describe("loadTestWallet", () => {
  test("loads test wallet", async () => {
    const wallet = await loadTestWallet();
    expect(wallet).toMatchSnapshot();
  });
});
