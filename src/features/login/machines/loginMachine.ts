import { setup, assign, assertEvent, fromPromise } from "xstate";
import { AoWallet } from "@/features/ao/lib/aoWallet";
import { getLocalWallet } from "../lib/localWallet";

const localKeyLocalStorageKey = "tempArweaveKey";
const lastUsedWalletTypeLocalStorageKey = "lastUsedWalletType";

export const loginMachine = setup({
  types: {
    context: {} as {
      lastUsedWalletType?: string;
      wallet?: AoWallet;
      disconnect?: () => void;
      localWallet?: AoWallet;
    },
    events: {} as
      | { type: "Connect"; data: { wallet: AoWallet; disconnect: () => void } }
      | { type: "Disconnect" }
      | { type: "External Disconnect" },
  },
  actions: {
    setWalletAndDisconnect: assign(({ event }) => {
      assertEvent(event, "Connect");
      return event.data;
    }),
    setLocalWallet: assign(({ event }) => ({
      // @ts-expect-error - event is not typed
      localWallet: event.output,
    })),
    runDisconnect: ({ context }) => {
      context.disconnect?.();
    },
    clearWalletAndDisconnect: assign(() => {
      return {
        wallet: undefined,
        disconnect: undefined,
      };
    }),
    loadLastUsedWalletType: assign(() => ({
      lastUsedWalletType:
        localStorage.getItem(lastUsedWalletTypeLocalStorageKey) ?? undefined,
    })),
    setAndPersistLastUsedWalletType: assign(({ event }) => {
      assertEvent(event, "Connect");
      localStorage.setItem(
        lastUsedWalletTypeLocalStorageKey,
        event.data.wallet.type,
      );
      return {
        lastUsedWalletType: event.data.wallet.type,
      };
    }),
    clearLastUsedWalletType: assign(() => {
      localStorage.removeItem(lastUsedWalletTypeLocalStorageKey);
      return {
        lastUsedWalletType: undefined,
      };
    }),
  },
  actors: {
    connectToLastUsedWallet: fromPromise(() => {
      throw new Error("Not implemented");
    }),
    loadLocalWallet: fromPromise(() => getLocalWallet(localKeyLocalStorageKey)),
  },
  guards: {
    hasLastUsedWallet: ({ context: { lastUsedWalletType } }) => {
      return lastUsedWalletType !== undefined;
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBsD2UCWA7AsgQwGMALbMAOgEksMAXDPZAYgG0AGAXUVAAdVZaMqLFxAAPRAEZWrMqwDMEgBwAWAKwA2RRNWqJ6gJwAaEAE9EmsuoBMy26ysS5Adk22Avm+NpMuQiSzkVAIMLBKcSCC8-HRCIuIIEsoSZIpW+qzKVlr6OXqKxmYIVg5kEmXqqvrqClrqiR5e6Nj4xKRkADLoMBAABFSMACIYsARCAQQ0bOE8fAKxEfE5cqVyVjpyqpk2jgWIVnLLqi4ZcoqqVqyKTpsNIN7Nfm2dUN19WIwAoqI0YABOWAwekMRmMwBMpiIonNhAtEPormQnPodPZlHJNOonPlTIhnMsMkkrNc0jo1MpbvdfK0Ah0utgoG9GABhUHgjiQ2YxGGgRaqRRkfRlRyKFT7XSqXYIJyHBROIlaU5yVj1Tx3JpU-zkZ4+BlUMgAFV+Jh6ACUwayaIw-r9UL8yNxkHgaAAzW0AWzIlJamtpL3pbwNRtN5qw4xoCGwADdUAQnYIsFMIREoVy4ri+WRNhc1EpWNdVpKJFkUjYNtdKtKMuoKervU86VhdVgyABlIioADuPWe2B6AFUKLTY8gegB1BjIMA0buoPAQemMCBCchR1AAa3IXseNO1-r1bc7M58-cHnWHY4nU5nc-pEaw0djXMT7OTnPjaYQchyKX0ymVWXkBwKklWwnFKJxlEFJUHHRK4ax8OsdwbJtW3bLseywE8h0BcdkEnadOhvRsrV+G07QdJ1XV+D0t2pLVkIDA90PVLCzxwy8CNnedGzvB84yEZ9pkiN95h5cw1ksVQy2cfQnAJCRJXRVQVjlC4tGURRNCsDxVSwVAIDgERaM1DlonfWEEAAWisawyA0pwyiJPMDmKSVLO0flElFJJpQkJFLngh46Moag6AYUzoQ-azEjsq5HLk6VVisECrEsOQNL5OSHD0KTAo1esXkgN4ItTCyi3S0ociyVQMk2SpJX2VL1nSSCDmuIs8sQ+i-UbYrXzM0SxD2KpZD89K8zlJRrmUNy5JLFFlX0ZxlCcFxOu3bqdQDQ1jTNUZQzBGgSvMsTP1sUbpT-VaHCuTZC3UOzZMyRIji0EVq1VYyCq2-c0KPXsB2Owb4nS5SNBcdEHOuhScSKKSBVkkUqmsaoqnJT7aw230fubJj-swgdsJHXD8OvbioCB7khs-JbM0xapMT8ybFL-WKIMUeQvyZmx1uC3det+w8MNYmN2Lwq8zTnQoZgGqn4iSZYanOLIDGkMo5ElHR+VYfQgL0XWOb5XmfX5lC8eFwm2OJjieg+UjbUpj9rGU5R1DV655HSL9NYzHW9YMACjZ0oA */
  id: "loginMachine",
  context: {},
  initial: "Initial",
  states: {
    Initial: {
      always: [
        {
          target: "Logging In.Try Reconnect",
          guard: "hasLastUsedWallet",
        },
        {
          target: "Logging In.Show Login UI",
          reenter: true,
        },
      ],

      entry: "loadLastUsedWalletType",
    },

    "Logged In": {
      on: {
        Disconnect: {
          target: "Logging In.Show Login UI",
          actions: "runDisconnect",
        },

        "External Disconnect": "Logging In.Show Login UI",
      },

      exit: "clearWalletAndDisconnect",
    },

    "Logging In": {
      initial: "Try Reconnect",

      states: {
        "Try Reconnect": {
          invoke: {
            src: "connectToLastUsedWallet",
            input: ({ context: { lastUsedWalletType } }) => ({
              walletType: lastUsedWalletType!,
            }),

            onError: {
              target: "Show Login UI",
              actions: "clearLastUsedWalletType",
            },
          },
        },

        "Show Login UI": {
          states: {
            "Local Wallet Loading": {
              invoke: {
                src: "loadLocalWallet",

                onDone: {
                  target: "Local Wallet Ready",
                  actions: "setLocalWallet",
                },

                onError: "Local Wallet Error",
              },
            },

            "Local Wallet Ready": {},
            "Local Wallet Error": {},
          },

          initial: "Local Wallet Loading",
        },
      },

      on: {
        Connect: {
          target: "Logged In",
          actions: [
            "setWalletAndDisconnect",
            "setAndPersistLastUsedWalletType",
          ],
          reenter: true,
        },
      },
    },
  },
});
