import { describe, test, expect, beforeAll } from "vitest";
import {
  AoContractClient,
  createAoContractClient,
} from "@/features/ao/lib/aoContractClient";
import { loadTestWallet } from "@/features/ao/test/lib/fsWallet";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";
import { ArweaveId } from "@/features/arweave/lib/model";
import { createChatClient } from "./chatClient";

describe("createChatClient", () => {
  let testWallet: AoWallet;
  let chatTestAoContractClient: AoContractClient;

  beforeAll(async () => {
    testWallet = await loadTestWallet();
    chatTestAoContractClient = createAoContractClient(
      import.meta.env.VITE_LLAMA_LAND_PROCESS_ID,
      connect(),
      testWallet,
    );
  });

  test("creates client", async () => {
    const client = createChatClient(chatTestAoContractClient);
    expect(client).toMatchSnapshot();
  });

  test(
    "CreateMessage",
    async () => {
      const client = createChatClient(chatTestAoContractClient);

      const initialName = "Test Name";
      const initialMessage = "Test Message";
      const createMsgId = await client.postMessage({
        AuthorName: initialName,
        Content: initialMessage,
      });
      expect(ArweaveId.safeParse(createMsgId).success).toBe(true);
      // Wait for the message to be processed
      await new Promise((resolve) => setTimeout(resolve, 5000));
      // Check the info is correct
      const createdChat = await client.readHistory();
      const mostRecentMessage = Object.values(createdChat)
        .sort((a, b) => a.Timestamp - b.Timestamp)
        .pop();

      expect(mostRecentMessage?.AuthorId).toEqual(testWallet.address);
      expect(mostRecentMessage?.Content).toEqual(initialMessage);
    },
    {
      timeout: 20000,
    },
  );

  test(
    "ReadCount",
    async () => {
      const client = createChatClient(chatTestAoContractClient);
      const count = await client.readCount();
      expect(count).toBeGreaterThan(0);
    },
    {
      timeout: 20000,
    },
  );
});
