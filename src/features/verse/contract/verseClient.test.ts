import { describe, test, expect, beforeAll } from "vitest";
import { createVerseClient } from "./verseClient";
import { AoContractClient, createAoContractClient } from "@/features/ao/lib/aoContractClient";
import { loadTestWallet } from "@/features/ao/test/lib/fsWallet";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";
import { ArweaveId } from "@/features/arweave/lib/model";


describe('createVerseClient', () => {
  let testWallet: AoWallet;
  let testAoContractClient: AoContractClient;
  let universeAoContractClient: AoContractClient;
  let weaveWorldAoContractClient: AoContractClient;

  beforeAll(async () => {
    testWallet = await loadTestWallet();
    testAoContractClient = createAoContractClient(import.meta.env.VITE_READ_PROCESS_ID, connect(), testWallet);
    universeAoContractClient = createAoContractClient(import.meta.env.VITE_UNIVERSE_PROCESS_ID, connect(), testWallet);
    weaveWorldAoContractClient = createAoContractClient(import.meta.env.VITE_WEAVE_WORLD_PROCESS_ID, connect(), testWallet);
  })

  test('creates client', async () => {
    const client = createVerseClient(testAoContractClient)
    expect(client).toMatchSnapshot();
  })

  test('Universe readInfo', async () => {
    const client = createVerseClient(universeAoContractClient)
    const info = await client.readInfo();
    expect(info).toMatchSnapshot();
  })
  
  test('Universe readParameters', async () => {
    const client = createVerseClient(universeAoContractClient)
    const info = await client.readParameters();
    expect(info).toMatchSnapshot();
  })

  test('Universe readAllEntities', async () => {
    const client = createVerseClient(universeAoContractClient)
    const info = await client.readAllEntities();
    expect(info).toMatchSnapshot();
  })

  test('WeaveWorld createEntity & update', async () => {
    const client = createVerseClient(weaveWorldAoContractClient)

    const initialPosition = [2, 2];
    const createMsgId = await client.createEntity({
      Type: "Avatar",
      Position: initialPosition,
    });
    expect(ArweaveId.safeParse(createMsgId).success).toBe(true);
    // Wait for the message to be processed
    await new Promise((resolve) => setTimeout(resolve, 5000));
    // Check the info is correct
    const createdEntities = await client.readAllEntities();
    expect(createdEntities[testWallet.address].Position).toEqual(initialPosition);
    expect(createdEntities[testWallet.address].Type).toEqual("Avatar");

    const updatedPosition = [4, 4];
    const updateMsgId = await client.updateEntityPosition(updatedPosition);
    expect(ArweaveId.safeParse(updateMsgId).success).toBe(true);
    // Wait for the message to be processed
    await new Promise((resolve) => setTimeout(resolve, 5000));
    // Check the info is correct
    const updatedEntities = await client.readAllEntities();
    expect(updatedEntities[testWallet.address].Position).toEqual(updatedPosition);
  }, {
    timeout: 20000,
  })
})
