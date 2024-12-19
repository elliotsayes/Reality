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
      profileId?: string;
      profileInfo?: ProfileInfo;
    },
  },
  guards: {
    hasProfile: (
      _,
      params: {
        profileId?: string;
        profileInfo?: ProfileInfo;
      },
    ) => params.profileId !== undefined && params.profileInfo !== undefined,
  },
  actions: {
    assignProfileIdAndInfo: assign(
      (
        _,
        params: {
          profileId: string;
          profileInfo: ProfileInfo;
        },
      ) => ({
        profileId: params.profileId,
        profileInfo: params.profileInfo,
      }),
    ),
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

        const noProfile = {
          profileId: undefined,
          profileInfo: undefined,
        };

        const timeout = new Promise((resolve) => {
          setTimeout(() => resolve(noProfile), 5000);
        });

        const profilePromise = (async () => {
          const profiles =
            await profileRegistryClient.getProfilesByAddress(address);
          if (profiles.length === 0) return noProfile;

          const primaryProfileId = profiles[0].ProfileId;

          const profileInfos = await profileRegistryClient.readProfiles([
            primaryProfileId,
          ]);
          if (profileInfos.length === 0) return noProfile;

          return {
            profileId: primaryProfileId,
            profileInfo: profileInfos[0],
          };
        })();

        return (await Promise.race([profilePromise, timeout])) as {
          profileId: string | undefined;
          profileInfo: ProfileInfo | undefined;
        };
      },
    ),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QFsCGBLAdgOgJKfQBd1UAbAYgG0AGAXUVAAcB7WI9ZzBkAD0QFoATABZq2AKzUAjOIAc1QQDZhATkHVFggDQgAnoikBmFROoqVsqSvHDDk6uIC+jnWizYAwgAswAYwDWWFAABABmzABOwYwRzKHopGDkEJxg2FgAbsz+aW443n6BmCHhUTFxCWAImcy+qMScNLRN3CxsDVxIvAJ2UtiytgDshtSDgoaD4oriOvoIvdiGilKTVlOCgrIqzq4Y+T4BQWGR0bHxicmp6ZhZOdh5ngdFJSfl51U1dR1NlFL0XW12JxuHwEEJsOZJMMpMJBEYpHCBrNEKJFNgpBjZIJrOIjFjJjsQA8CodiscymdKuQwBFYhFsIxSPVSsh7ntHoUjqVThVEtUbrV6hxMD86K1WEDOqBQTYJGNqLIJuJDOMsTM9IhxiZpoo1NYNoYEYZhM4XCBMMwIHBuHlxe1hSCeuZ+kMRmMldNkWC4f1NMJ-cIVoYllNCQ98OwyHbJY7vbDFoJJOpBrJBrqpl7pthxvCNCmsTJBmH2STnuSee9ox1Y-wRiZBGnxOJ1M3U2YvXDhNhpoZLA2ETYmyazcTmMhGWBCGBggB3IheYIABUpiSrDq6oNr1DEg1RDexk1ssi9wnk3ZUKqxKm3F9kThHJbHE6ns-nzAAroQlyuwGvgRvEGURYkw2WQwMGahT20DUEFPMRdUvbEb17RRi3cABlLxmBnYIAFFaUiP8pW6eZhHEdEzDWf1FGGGwOwmCFJEULYsQUNRZFNRwgA */
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
              type: "assignProfileIdAndInfo",
              params: ({ event }) => ({
                profileId: event.output.profileId!,
                profileInfo: event.output.profileInfo!,
              }),
            },
          },
          {
            target: "Complete without Profile",
            reenter: true,
          },
        ],

        onError: "Show Error",
      },
    },

    "Complete with Profile": {
      tags: ["showRenderer"],
    },
    "Complete without Profile": {
      tags: ["showRenderer"],
    },
    "Show Error": {},
  },

  initial: "Initial",
});
