import { describe, test, expect, beforeAll } from "vitest";
import { createVerseClient } from "./verseClient";
import { AoContractClient, createAoContractClient } from "@/features/ao/lib/aoContractClient";
import { loadTestWallet } from "@/features/ao/test/lib/fsWallet";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";


describe('createVerseClient', () => {
  let testWallet: AoWallet;
  let testAoContractClient: AoContractClient;
  let universeAoContractClient: AoContractClient;

  beforeAll(async () => {
    testWallet = await loadTestWallet();
    testAoContractClient = createAoContractClient(import.meta.env.VITE_READ_PROCESS_ID, connect(), testWallet);
    universeAoContractClient = createAoContractClient(import.meta.env.VITE_UNIVERSE_PROCESS_ID, connect(), testWallet);
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
})
