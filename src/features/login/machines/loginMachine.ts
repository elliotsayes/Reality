import { setup, assign, assertEvent, fromPromise } from 'xstate';
import { AoWallet } from '@/features/ao/lib/aoWallet';

const lastUsedWalletTypeKey = 'lastUsedWalletType';

export const loginMachine = setup({
  types: {
    context: {} as {
      lastUsedWalletType?: string;
      wallet?: AoWallet;
      disconnect?: () => void;
    },
    events: {} as
      | { type: 'Connect', data: { wallet: AoWallet, disconnect: () => void } }
      | { type: 'Disconnect' }
      | { type: 'ExternalDisconnect' }
  },
  actions: {
    setWalletAndDisconnect: assign(({ event }) => {
      assertEvent(event, 'Connect');
      return event.data;
    }),
    runDisconnect: ({ context }) => {
      context.disconnect?.();
    },
    clearWalletAndDisconnect: assign(() => {
      return {
        wallet: undefined,
        disconnect: undefined
      };
    }),
    loadLastUsedWalletType: assign(() => ({
      lastUsedWalletType: localStorage.getItem(lastUsedWalletTypeKey) ?? undefined
    })),
    setAndPersistLastUsedWalletType: assign(({ event }) => {
      assertEvent(event, 'Connect');
      localStorage.setItem(lastUsedWalletTypeKey, event.data.wallet.type);
      return {
        lastUsedWalletType: event.data.wallet.type
      };
    }),
    clearLastUsedWalletType: assign(() => {
      localStorage.removeItem(lastUsedWalletTypeKey);
      return {
        lastUsedWalletType: undefined
      };
    }),
  },
  actors: {
    connectToLastUsedWallet: fromPromise(() => {
      throw new Error('Not implemented');
    }),
  },
  guards: {
    'hasLastUsedWallet': ({ context: { lastUsedWalletType } }) => {
      return lastUsedWalletType !== undefined;
    },
  }
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBsD2UCWA7AsgQwGMALbMAOgEksMAXDPZAYgG0AGAXUVAAdVZaMqLFxAAPRAEZWrMqwDMEgBwAWAKwA2RRNWqJ6gJwAaEAE9EmsuoBMy26ysS5Adk22Avm+NpMuQiSzkVAIMLBKcSCC8-HRCIuIIEsoSZIpW+qzKVlr6OXqKxmYIVg5kEmXqqvrqClrqiR5e6Nj4xKRkADLoMBAABFSMACIYsARCAQQ0bOE8fAKxEfEuVqVO+k6K+iqsTqtyBZIqsomK9nIVOolODSDezX5tnVDdfViMAKKiNGAATlgMPUMRmMwBMpiIonNhAtEE4NClMk45IpEaplKxVPlTIg5FY5GRlKlFIp1Bk5KwlKprrdfK0Ah0utgoC9GABhYGgjjg2YxKGgRZWJxkfQY5y6NFE4X7Ip4tYZYk4pxpcVyKlNGn+ciPHxMqhkAAq3xMPQASiD2TRGD9vqhvmRuMg8DQAGY2gC2ZGpLQ19KejJe+sNJrNWHGNAQ2AAbqgCI7BFgpmCIhCeXFsRiyKirBldCdYTipRIsikbHJVLDKoiMuoPJ4QFhUBA4CJPfcAlzonHUwgALRWaz45FlAXbOQ4qxS7vaRSlAlyYXo0tVK61lu0wLUOgMduQru9xIDpxDpwjsdSzKWOQEjHHhx6VQqldqr0PLqQF7blPQhLSPE2CoOS85zWCQC1SIV9D7apbEVbR6kfHxnzpLU-SoD9Oy-NJ1CORE0R2BxkVRCdj2LVFiVWdYJQkVUENbTUGSwHUsADI1TVGEMQRoND5j5bFbGwy9thggjlALLDlDWTJEjLLQiWreC7jXH1tX9ABlIhUAAdx6R5sB6ABVCguN5MREEyZYkX0KQs3sVZlD2LEigsXD1GqdYJE2ZwazcIA */
  id: 'loginMachine',
  context: {},
  initial: "Initial",
  states: {
    Initial: {
      always: [{
        target: "Logging In.Try Reconnect",
        guard: "hasLastUsedWallet"
      }, {
        target: "Logging In.Show Login UI",
        reenter: true
      }],

      entry: "loadLastUsedWalletType"
    },

    "Logged In": {
      on: {
        Disconnect: {
          target: "Logging In.Show Login UI",
          actions: "runDisconnect"
        },

        "External Disconnect": "Logging In.Show Login UI"
      },

      exit: "clearWalletAndDisconnect"
    },

    "Logging In": {
      initial: "Try Reconnect",

      states: {
        "Try Reconnect": {
          invoke: {
            src: "connectToLastUsedWallet",
            input: ({ context: { lastUsedWalletType } }) => ({ walletType: lastUsedWalletType! }),

            onError: {
              target: "Show Login UI",
              actions: "clearLastUsedWalletType"
            }
          }
        },

        "Show Login UI": {}
      },

      on: {
        Connect: {
          target: "Logged In",
          actions: ["setWalletAndDisconnect", "setAndPersistLastUsedWalletType"],
          reenter: true
        }
      }
    }
  }
});
