import { describe, test, expect, beforeAll } from "vitest";
import { createProfileClient } from "./profileClient";
import { AoContractClient, createAoContractClient } from "@/features/ao/lib/aoContractClient";
import { loadTestWallet } from "@/features/ao/test/lib/fsWallet";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";
import { ArweaveId } from "@/features/arweave/lib/model";


describe('createProfileClient', () => {
  let testWallet: AoWallet;
  let profileTestAoContractClient: AoContractClient;

  beforeAll(async () => {
    testWallet = await loadTestWallet();
    profileTestAoContractClient = createAoContractClient(import.meta.env.VITE_PROFILETEST_PROCESS_ID, connect(), testWallet);
  })

  test('creates client', async () => {
    const client = createProfileClient(profileTestAoContractClient)
    expect(client).toMatchSnapshot();
  })

  test('WeaveWorld createEntity & update', async () => {
    const client = createProfileClient(profileTestAoContractClient)

    const initialName = "Test Name";
    const initialAvatarSeed = "a1204030b070a01";
    const createMsgId = await client.createProfile({
      Name: initialName,
      AvatarSeed: initialAvatarSeed,
    });
    expect(ArweaveId.safeParse(createMsgId).success).toBe(true);
    // Wait for the message to be processed
    await new Promise((resolve) => setTimeout(resolve, 5000));
    // Check the info is correct
    const createdProfile = await client.readProfiles([testWallet.address]);
    expect(createdProfile[testWallet.address].Name).toEqual(initialName);
    expect(createdProfile[testWallet.address].AvatarSeed).toEqual(initialAvatarSeed);

    const updatedName = "New Name";
    const updateMsgId = await client.updateProfile({
      Name: updatedName,
    });
    expect(ArweaveId.safeParse(updateMsgId).success).toBe(true);
    // Wait for the message to be processed
    await new Promise((resolve) => setTimeout(resolve, 5000));
    // Check the info is correct
    const updatedProfile = await client.readProfiles([testWallet.address]);
    expect(updatedProfile[testWallet.address].Name).toEqual(updatedName);
    expect(updatedProfile[testWallet.address].AvatarSeed).toEqual(initialAvatarSeed);
  }, {
    timeout: 20000,
  })
})
