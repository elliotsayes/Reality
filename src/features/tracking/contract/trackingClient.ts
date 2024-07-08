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
    const reply = await aoContractClient.messageDelayReplyOne({
      tags: [
        {
          name: "Action",
          value: "Tracking-Login",
        },
      ],
    });

    const actionTagValue = reply.Tags.find(
      (tag) => tag.name === "Action",
    )?.value;
    const messageTagValue = reply.Tags.find(
      (tag) => tag.name === "Message",
    )?.value;
    if (actionTagValue === "Login-UnAuthorised") {
      return {
        IsAuthorised: false,
        HasReward: false,
        Reward: undefined,
        Message: messageTagValue || "",
      };
    } else if (actionTagValue === "Login-Info") {
      return {
        IsAuthorised: true,
        HasReward: false,
        Reward: undefined,
        Message: messageTagValue || "",
      };
    } else if (actionTagValue === "Login-Reward") {
      const quantityTagValue = reply.Tags.find(
        (tag) => tag.name === "Quantity",
      )?.value;
      return {
        IsAuthorised: true,
        HasReward: true,
        Reward: parseInt(quantityTagValue || "0"),
        Message: messageTagValue || "",
      };
    } else if (actionTagValue === "Login-Failed") {
      return {
        IsAuthorised: false,
        HasReward: false,
        Reward: undefined,
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
