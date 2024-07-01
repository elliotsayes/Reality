import {
  AoContractClient,
  AoContractError,
  createAoContractClient,
} from "../../ao/lib/aoContractClient";
import { AoWallet } from "../../ao/lib/aoWallet";
import { connect } from "@permaweb/aoconnect";
import { LoginResult } from "./model";

export type TrackingClient = {
  aoContractClient: AoContractClient;

  // Writes
  login(): Promise<LoginResult>;
};

// Placeholder
// TODO: Define these methods properly
export const createTrackingClient = (
  aoContractClient: AoContractClient,
): TrackingClient => ({
  aoContractClient: aoContractClient,

  // Writes
  login: async () => {
    const result = await aoContractClient.messageResult({
      tags: [
        {
          name: "Action",
          value: "Tracking-Login",
        },
      ],
    });
    if (result.Messages.length === 0) {
      throw new AoContractError("No messages returned");
    }

    const reply = result.Messages[0];
    const replyTags: Array<{
      name: string;
      value: string;
    }> = reply.Tags;
    const actionTagValue = replyTags.find(
      (tag) => tag.name === "Action",
    )?.value;
    const messageTagValue = replyTags.find(
      (tag) => tag.name === "Message",
    )?.value;
    if (actionTagValue === "Login-Unauthorized") {
      return {
        IsAuthorized: false,
        HasReward: false,
        Reward: undefined,
        Message: messageTagValue || "",
      };
    } else if (actionTagValue === "Login-Info") {
      return {
        IsAuthorized: true,
        HasReward: false,
        Reward: undefined,
        Message: messageTagValue || "",
      };
    } else if (actionTagValue === "Login-Reward") {
      const quantityTagValue = replyTags.find(
        (tag) => tag.name === "Quantity",
      )?.value;
      return {
        IsAuthorized: true,
        HasReward: true,
        Reward: parseInt(quantityTagValue || "0"),
        Message: messageTagValue || "",
      };
    } else {
      throw new AoContractError(`Unexpected action: ${actionTagValue}`);
    }
  },
});

export const createTrackingClientForProcess =
  (wallet: AoWallet) => (processId: string) => {
    const aoContractClient = createAoContractClient(
      processId,
      connect(),
      wallet,
    );
    return createTrackingClient(aoContractClient);
  };

export type TrackingClientForProcess = ReturnType<
  typeof createTrackingClientForProcess
>;
