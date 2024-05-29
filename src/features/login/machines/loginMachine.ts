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
  },
  actions: {
    setWalletAndDisconnect: assign(({ event }) => {
      assertEvent(event, 'Connect');
      return event.data;
    }),
    clearWalletAndDisconnect: assign(({ context }) => {
      context.disconnect?.();
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
  /** @xstate-layout N4IgpgJg5mDOIC5QBsD2UCWA7AsgQwGMALbMAOgEksMAXDPZAYgG0AGAXUVAAdVZaMqLFxAAPRAEZWrMqwDMEgBwAWAKwA2RRNWqJ6gJwAaEAE9EmsuoBMy26ysS5Adk22Avm+NpMuQiSzkVAIMLBKcSCC8-HRCIuIIEk4y+laKiuqq+nJWrIkSVsZmCFYOZMpWTpX6ilb66spKih5e6Nj4xKRkADLoPlAABFRkACoATib9AEpgBEIBBDSMYKOjqKNk3Mh4NABmawC2ZN5tfp09UH2DWCPjUzNzMzQI2ABuqATbglhs7D8iUQJYhF4nIDGRVDZVHI0mksk5lOpCpJdOCNPplNkXIl6s0QMdfB0At1epArowACIYWCzLDzGh-CIAmLCYGIJwouQaGH6KQNVjKJHFDSyaqZPQOGwuXH49r+cjnS5URgAYQeCwZPD4gJZoHiTgqZH0qkUzl0ylYsNUgqsckNSWU6UxtXNJo8nhAWFQEDgIhlpwC-y1zLiiAAtFZ6mUTRb9E50RbEaYw44JGREi4IaxVEknHJlNLWgS5ZRqHQGIHol8Qwhw3oo3IY3GXYmiuVLHnFKpWPDWPUJGp8+6-YT5b1sAMhmMJtMaXSK9rq5zlIb9LHY8aJKLFIK2+oO12e333EPC7KziSIFd58HWQlcvoyJ3+9J9YlqgUkwlO4-2bVu+UdG0AsfDPIkFXHK4yAAZSIVAAHd+nObB+gAVQoa8q1vcorDIaEeXsaQKnRORrQsc0XD3JwtGqZxgJOEdiQuCCqAwoFdUQBt1BXNd2Woztt0-UMMUfVRlCcKRcnsTQJAkN03CAA */
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
          actions: "clearWalletAndDisconnect"
        }
      }
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
