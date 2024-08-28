import { AoContractClientForProcess, ReadArgs } from "@/features/ao/lib/aoContractClient";
import { Asset, DetailedAsset, ProfileAssets, ProfileInfo } from "@/features/profile/contract/model";
import { ProfileClientForProcess } from "@/features/profile/contract/profileClient";
import { ProfileRegistryClient } from "@/features/profile/contract/profileRegistryClient";
import { fromPromise, setup, assign } from "xstate";

type InitialContext = {
  address: string;
  profileRegistryClient: ProfileRegistryClient;
  profileClientForProcess: ProfileClientForProcess;
  aoContractClientForProcess: AoContractClientForProcess;
};

export const mainMachine = setup({
  types: {
    input: {} as {
      initialContext: InitialContext;
    },
    context: {} as InitialContext & {
      profileId?: string;
      profileInfo?: ProfileInfo;
      assets?: ProfileAssets;
    },
  },
  guards: {
    hasProfile: (
      _,
      params: {
        profileId?: string;
        profileInfo?: ProfileInfo;
        assets?: ProfileAssets;
      },
    ) => params.profileId !== undefined && params.profileInfo !== undefined && params.assets !== undefined,
  },
  actions: {
    assignProfileIdAndInfo: assign(
      (
        _,
        params: {
          profileId: string;
          profileInfo: ProfileInfo;
          assets: ProfileAssets;
        },
      ) => ({
        profileId: params.profileId,
        profileInfo: params.profileInfo,
        assets: params.assets
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
          client: ProfileClientForProcess;
          aoContractClientForProcess: AoContractClientForProcess;
        };
      }) => {
        const { address, profileRegistryClient, client, aoContractClientForProcess } = input;

        const noProfile = {
          profileId: undefined,
          profileInfo: undefined,
          assets: undefined,
        };

        const profiles =
          await profileRegistryClient.getProfilesByAddress(address);
        if (profiles.length === 0) return noProfile;

        const primaryProfileId = profiles[0].ProfileId;

        const profileInfos = await profileRegistryClient.readProfiles([
          primaryProfileId,
        ]);
        if (profileInfos.length === 0) return noProfile;

        let profileClient = client(primaryProfileId)


        let responseData = await profileClient.grabProfileAssets()
        // Assuming responseData.Data is a string, we first need to parse it
        const dataObject = JSON.parse(responseData.Data);

        // Now we can extract the Assets array from the parsed JSON
        const assetsData = dataObject.Assets;

        // Info Arguments
        const args: ReadArgs = {
          tags: [{ name: "Action", value: "Info" }],
        }

        let detailedAssets: DetailedAsset[] = [];

        for (const asset of assetsData) {
          let assetFormal: Asset = Asset.parse(asset);

          let assetClient = aoContractClientForProcess(asset.Id);
          let message = await assetClient.dryrunReadReplyOne(args);

          let logoTag = message.Tags.find(tag => tag.name === "Logo");
          let denominationTag = message.Tags.find(tag => tag.name === "Denomination")

          if (denominationTag !== undefined) {
            let denominator = 10 ** Number(denominationTag.value);
            let quantityValue = Number(assetFormal.Quantity);
            assetFormal.Quantity = (quantityValue / denominator).toString()
          }


          let detailedAsset;

          if (logoTag === undefined) {
            detailedAsset = DetailedAsset.parse({ asset: assetFormal, icon: assetFormal.Id });
          } else {
            detailedAsset = DetailedAsset.parse({ asset: assetFormal, icon: logoTag.value });
          }

          detailedAssets.push(detailedAsset);
        }



        // Parsing and validating the data with the ProfileAssets schema
        const profileAssets = ProfileAssets.parse(detailedAssets);

        console.log("Validated Profile Assets:", profileAssets);
        return {
          profileId: primaryProfileId,
          profileInfo: profileInfos[0],
          assets: profileAssets,
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
          client: context.profileClientForProcess,
          aoContractClientForProcess: context.aoContractClientForProcess
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
                assets: event.output.assets!,
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
