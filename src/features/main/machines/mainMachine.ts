import { ProfileInfo } from "@/features/profile/contract/model";
import { ProfileRegistryClient } from "@/features/profile/contract/profileRegistryClient";
import { fromPromise, setup, assign } from "xstate";

type InitialContext = {
  address: string;
  profileRegistryClient: ProfileRegistryClient;
};

export const mainMachine = setup({
  types: {
    input: {} as {
      initialContext: InitialContext;
    },
    context: {} as InitialContext & {
      profileInfo?: ProfileInfo;
    },
  },
  guards: {
    hasProfile: (
      _,
      params: {
        profileInfo?: ProfileInfo;
      },
    ) => params.profileInfo !== undefined,
  },
  actions: {
    assignProfileInfo: assign({
      profileInfo: (
        _,
        params: {
          profileInfo: ProfileInfo;
        },
      ) => params.profileInfo,
    }),
  },
  actors: {
    checkForProfile: fromPromise(
      async ({
        input,
      }: {
        input: {
          address: string;
          profileRegistryClient: ProfileRegistryClient;
        };
      }) => {
        const { address, profileRegistryClient } = input;
        console.log("address", address);
        console.log(
          "profileRegistryClientId",
          profileRegistryClient.aoContractClient.processId,
        );
        const profiles =
          await profileRegistryClient.getProfilesByDelegate(address);
        console.log("profileIds", profiles);
        if (profiles.length === 0) {
          return {
            profileInfo: undefined,
          };
        }
        const primaryProfileId = profiles[0].ProfileId;
        console.log("primaryProfileId", primaryProfileId);
        const profileInfos = await profileRegistryClient.readProfiles([
          primaryProfileId,
        ]);
        console.log("profileInfos", profileInfos);
        if (profileInfos.length === 0) {
          return {
            profileInfo: undefined,
          };
        }
        return {
          profileInfo: profileInfos[0],
        };
      },
    ),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QFsCGBLAdgOgJKfQBd1UAbAYgG0AGAXUVAAcB7WI9ZzBkAD0QFoATABZq2AKzUAjOIAc1QQDZhATkHVFggDQgAnoikBmFROoqVsqSvHDDk6uIC+jnWizYAwgAswAYwDWWFAABABmzABOwYwRzKHopGDkEJxg2FgAbsz+aW443n6BmCHhUTFxCWAImcy+qMScNLRN3CxsDVxIvAJ2UtiytgDshtSDgoaD4oriOvoIvdiGilKTVlOCgrIqzq4Y+T4BQWGR0bHxicmp6ZhZOdh5ngdFJSfl51U1dR1NlFL0XW12JxuHwEEJsOZJMMpMJBEYpHCBrNEKJFNgpBjZIJrOIjFjJjsQA8CodiscymdKuQwBFYhFsIxSPVSsh7ntHoUjqVThVEtUbrV6hxMD86K1WEDOqBQTYJGNqLIJuJDOMsTM9IhxiZpoo1NYNoYEYZhM4XCBMMwIHBuHlxe1hSCeuZ+kMRmMldNkWC4f1NK6pLJJsJhIpFISHvh2GQ7ZLHd7YYtBJJ1INA7qpl7pthxvCNKmsTJBuH2STnuSee8Yx04-wRiZBINpuJ1M3A2YvXDhNhpoZLA2ETZxDZi+4PMxkIywIQwMEAO5ELzBAAKlMSVYdXVBteoYkGqIb2KDva9wnk3ZUKqxKh3F9kTjNDwAylOjgBXRgVyrr4GbxCKQbZtQp6DBiQ4hsqignmeuqXtiN69veuzuI+XjMLOwQAKK0pE35St08zCOI6JmGswb-nYwgdhMEKSIoWxYgoaiyKajhAA */
  context: ({ input }) => ({
    ...input.initialContext,
    profileInfo: undefined,
  }),

  id: "main",

  states: {
    Initial: {
      always: "Checking for profile",
    },

    "Checking for profile": {
      invoke: {
        src: "checkForProfile",

        input: ({ context }) => ({
          address: context.address,
          profileRegistryClient: context.profileRegistryClient,
        }),

        onDone: [
          {
            target: "Complete with Profile",
            guard: {
              type: "hasProfile",
              params: ({ event }) => event.output,
            },
            actions: {
              type: "assignProfileInfo",
              params: ({ event }) => ({
                profileInfo: event.output.profileInfo!,
              }),
            },
          },
          {
            target: "Seting up profile",
            reenter: true,
          },
        ],

        onError: "Show Error",
      },
    },

    "Complete with Profile": {},
    "Seting up profile": {},
    "Show Error": {},
  },

  initial: "Initial",
});
