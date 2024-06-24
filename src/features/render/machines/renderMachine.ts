import { ProfileRegistryClient } from "@/features/profile/contract/profileRegistryClient";
import {
  VerseClient,
  VerseClientForProcess,
} from "@/features/verse/contract/verseClient";
import { setup, assign, assertEvent, fromPromise } from "xstate";
import { Preloader } from "../lib/phaser/scenes/Preloader";
import { MainMenu } from "../lib/phaser/scenes/MainMenu";
import { VerseScene } from "../lib/phaser/scenes/VerseScene";
import { listenScene, listenSceneEvent } from "../lib/EventBus";
import { loadVersePhaser } from "../lib/load/verse";
import { AoContractClientForProcess } from "@/features/ao/lib/aoContractClient";
import {
  ChatClient,
  ChatClientForProcess,
} from "@/features/chat/contract/chatClient";
import { MessageHistory } from "@/features/chat/contract/model";
import { VerseState } from "../lib/load/model";

export const renderMachine = setup({
  types: {
    input: {} as {
      playerAddress: string;
      initialVerseId?: string;
      clients: {
        aoContractClientForProcess: AoContractClientForProcess;
        profileRegistryClient: ProfileRegistryClient;
        verseClientForProcess: VerseClientForProcess;
        chatClientForProcess: ChatClientForProcess;
      };
      setVerseIdUrl: (verseId: string) => void;
    },
    context: {} as {
      playerAddress: string;

      initialVerseId?: string;
      clients: {
        aoContractClientForProcess: AoContractClientForProcess;
        profileRegistryClient: ProfileRegistryClient;
        verseClientForProcess: VerseClientForProcess;
        chatClientForProcess: ChatClientForProcess;
      };
      setVerseIdUrl: (verseId: string) => void;

      cleanupGameEventListeners?: () => void;

      currentScene?: Phaser.Scene;
      typedScenes: {
        preloader?: Preloader;
        mainMenu?: MainMenu;
        verseScene?: VerseScene;
      };

      targetVerseId?: string;
      currentVerseId?: string;
      lastEntityUpdate?: Date;

      nextPosition?: Array<number>;
      processingPosition?: Array<number>;

      initialChatMessageOffset?: number;
      currentChatMessageOffset?: number;
      chatMessages: MessageHistory;
    },
    events: {} as
      | { type: "Scene Ready"; scene: Phaser.Scene }
      | { type: "Warp Immediate"; verseId: string }
      // | { type: 'Warp Overlap Start', verseId: string }
      | { type: "Update Position"; position: Array<number> }
      | { type: "Registration Confirmed" },
  },
  actions: {
    activateGameEventListener: assign({
      cleanupGameEventListeners: ({ self }) => {
        const c1 = listenScene("scene-ready", (scene: Phaser.Scene) => {
          self.send({ type: "Scene Ready", scene });
        });
        const c2 = listenSceneEvent((event) => {
          self.send(event);
        });
        return () => {
          c1();
          c2();
        };
      },
    }),
    cleanupGameEventListeners: ({ context }) => {
      context.cleanupGameEventListeners?.();
    },
    assignPreloader: assign(({ event }) => {
      assertEvent(event, "Scene Ready");
      return {
        currentScene: event.scene,
        typedScenes: { preloader: event.scene as Preloader },
      };
    }),
    assignMainMenu: assign(({ event }) => {
      assertEvent(event, "Scene Ready");
      return {
        currentScene: event.scene,
        typedScenes: { mainMenu: event.scene as MainMenu },
      };
    }),
    assignVerseScene: assign(({ event }) => {
      assertEvent(event, "Scene Ready");
      return {
        currentScene: event.scene,
        typedScenes: { verseScene: event.scene as VerseScene },
      };
    }),
    assignOtherScene: assign(({ event }) => {
      assertEvent(event, "Scene Ready");
      return { currentScene: event.scene };
    }),
    clearScenes: assign(() => {
      return { currentScene: undefined, typedScenes: {} };
    }),
    startMainMenu: ({ context }) => {
      context.currentScene?.scene.start("MainMenu");
    },
    startVerseScene: (
      { context },
      params: {
        verseId: string;
        verse: VerseState;
      },
    ) => {
      const { verseId, verse } = params;
      context.currentScene?.scene.start("VerseScene", {
        playerAddress: context.playerAddress,
        verseId,
        verse,
        aoContractClientForProcess: context.clients.aoContractClientForProcess,
      });
    },
    warpVerseScene: (
      { context },
      params: {
        verseId: string;
        verse: VerseState;
      },
    ) => {
      const { verseId, verse } = params;
      context.typedScenes.verseScene!.warpToVerse(
        context.playerAddress,
        verseId,
        verse,
        context.clients.aoContractClientForProcess,
      );
    },
    assignTargetVerseId: assign(({ event }) => {
      assertEvent(event, "Warp Immediate");
      return { targetVerseId: event.verseId };
    }),
    assignTargetVerseIdFromInitialVerseId: assign(({ context }) => ({
      targetVerseId: context.initialVerseId,
    })),
    assignCurrentVerseIdFromTargetVerseId: assign(({ context }) => ({
      currentVerseId: context.targetVerseId,
    })),
    clearCurrentVerseId: assign(() => ({
      currentVerseId: undefined,
    })),
    updateUrl: ({ context }) => {
      context.setVerseIdUrl(context.currentVerseId!);
    },
    assignNextPosition: assign(({ event }) => {
      assertEvent(event, "Update Position");
      return {
        nextPosition: event.position,
      };
    }),
    consumePositionFromQueue: assign(({ context }) => ({
      processingPosition: context.nextPosition,
      nextPosition: undefined,
    })),
    clearPositionQueue: assign(() => ({
      nextPosition: undefined,
    })),
    clearProcesssingPosition: assign(() => ({
      processingPosition: undefined,
    })),
    updateVerseSceneEntities: (
      { context, event },
      params: {
        entities: Awaited<ReturnType<VerseClient["readEntitiesDynamic"]>>;
        profiles: Awaited<ReturnType<ProfileRegistryClient["readProfiles"]>>;
      },
    ) => {
      console.log("updateVerseSceneEntities", event);
      const { entities, profiles } = params;
      context.typedScenes.verseScene!.mergeEntities(entities, profiles);
    },
    saveLastEntityUpdate: assign((_, params: { beforeTimestamp: Date }) => ({
      lastEntityUpdate: params.beforeTimestamp,
    })),
    sendRegistrationConfirmed: ({ self }) => {
      console.log("sendRegistrationConfirmed");
      self.send({ type: "Registration Confirmed" });
    },
    assignChatMessageOffset: assign((_, params: { messageCount: number }) => {
      const { messageCount } = params;
      return {
        initialChatMessageOffset: messageCount,
        currentChatMessageOffset: messageCount,
      };
    }),
    updateChatMessageOffset: assign(
      (_, params: { messages: MessageHistory }) => {
        const { messages } = params;
        if (messages.length === 0)
          return {
            currentChatMessageOffset: 0,
          };
        return {
          currentChatMessageOffset: messages[0].Id,
        };
      },
    ),
    notifyRendererOfNewMessages: (
      { context },
      params: { messages: MessageHistory },
    ) => {
      const { messages } = params;
      context.typedScenes.verseScene!.showEntityChatMessages(messages);
    },
    appendChatMessages: assign(
      ({ context }, params: { messages: MessageHistory }) => {
        const { messages } = params;
        return { chatMessages: context.chatMessages.concat(messages) };
      },
    ),
    clearChatMessages: assign(() => ({
      chatMessages: [],
    })),
  },
  guards: {
    hasIntialVerseId: ({ context }) => {
      console.log("hasIntialVerseId", context.initialVerseId);
      return context.initialVerseId !== undefined;
    },
    sceneKeyIsPreloader: ({ event }) => {
      assertEvent(event, "Scene Ready");
      return event.scene.scene.key === "Preloader";
    },
    sceneKeyIsMainMenu: ({ event }) => {
      assertEvent(event, "Scene Ready");
      return event.scene.scene.key === "MainMenu";
    },
    sceneKeyIsVerseScene: ({ event }) => {
      assertEvent(event, "Scene Ready");
      return event.scene.scene.key === "VerseScene";
    },
    hasNextPosition: ({ context }) => {
      return context.nextPosition !== undefined;
    },
  },
  actors: {
    loadVerse: fromPromise(
      async ({
        input,
      }: {
        input: {
          verseClient: VerseClient;
          profileRegistryClient: ProfileRegistryClient;
          phaserLoader: Phaser.Loader.LoaderPlugin;
        };
      }) => {
        console.log("loadVerse");
        const verseState = await loadVersePhaser(
          input.verseClient,
          input.profileRegistryClient,
          input.phaserLoader,
        );
        return {
          verseId: input.verseClient.verseId,
          verse: verseState,
        };
      },
    ),
    updateEntities: fromPromise(
      async ({
        input,
      }: {
        input: {
          verseClient: VerseClient;
          profileRegistryClient: ProfileRegistryClient;
          lastEntityUpdate?: Date;
        };
      }) => {
        const beforeTimestamp = new Date();
        const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
        const entities = await input.verseClient.readEntitiesDynamic(
          input.lastEntityUpdate ?? tenSecondsAgo,
        );
        const profiles = await input.profileRegistryClient.readProfiles(
          Object.keys(entities),
        );
        return {
          entities,
          profiles,
          beforeTimestamp,
        };
      },
    ),
    updatePosition: fromPromise(
      async ({
        input,
      }: {
        input: {
          verseClient: VerseClient;
          position: Array<number>;
        };
      }) => {
        console.log("updatePosition", input.position);
        return await input.verseClient.updateEntityPosition(input.position);
      },
    ),
    registerEntity: fromPromise(
      async ({
        input,
      }: {
        input: {
          verseClient: VerseClient;
        };
      }) => {
        const verseParams = await input.verseClient.readParameters();
        const msgId = await input.verseClient.createEntity({
          Type: "Avatar",
          Position: verseParams["2D-Tile-0"]?.Spawn || [0, 0],
        });
        return msgId;
      },
    ),
    loadChatMessageCount: fromPromise(
      async ({
        input,
      }: {
        input: {
          chatClient: ChatClient;
        };
      }) => {
        return await input.chatClient.readCount();
      },
    ),
    loadChatMessagesSinceOffset: fromPromise(
      async ({
        input,
      }: {
        input: {
          chatClient: ChatClient;
          offset: number;
        };
      }) => {
        return await input.chatClient.readHistory({
          idAfter: input.offset,
        });
      },
    ),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCcwDsJmQWQIYGMALASzTAGIBlfdMAAgCUxcIBPAbQAYBdRUABwD2sYgBdigtHxAAPRAFYAnAEYAdAA51igEy752gMyL5WgDQhWiALTL1qgGzqDB+-ZcAWAOxL7n9QF9-c1QMLDwiUgpqWkZmNnZlXiQQIRFxSWk5BGVtRU9VThU85WNteUd3c0sEGztHZ1cPb0V7HUDg9EwcAhIyKhoyWJYObSSBYTEJKWSs3QN85WV7eU53Q04lRSrrWwcnFzd7Lx8j9pAQrvDeqIH6JmH2AzGUifTp0CyDd2VODVyj7SeFRzTzbbIGVQHTyudzueTzdycbT2M4XMI9SKqACSaEmuAANuQuM9UpMMjNEIDFKp5O5NJ4DOptIVFFp5GDAfl7IDOEZ1Kt5AyDKjOuiImRsWg6ABxXAAWzAkroeFIyvQAFdJXjCQB1XDIfh0LFyhUQYi4URgYnSUlvTKIZSIiGcHKcTTKPw-TygiyIbkQtyLRSKNaeZQmbQi0LdcWKnEy+VxqUq5Ma1QAGUELDoADUsLAKBBJIrSAA3QQAa0VaJj1yVsoVSpTarQmsz2bzyALCDLgnwFqmxOtyVtU3t2UR8khvM8ZVn7iO7N9CHU0MhR0U82U8zys6jlwxEvjDaTdAACqh8VmulrxASiTwba8xxSELS6stt679ECDGCjr8BicAynhIjo2iIoo+5inWx6JkqF5gFeLBYLe5qEgkJLPuSHyIOo3IaGsjjyNu9JHP+sIOAYOSuMis6eO4UFBOcoq1picGNvGiHITe7YQLm+aFsWqi9lWqg1lc7FSieCGXteqF8QJXZgD2aDlv2bxDo+I7Ye8sh+i6NL6HS+jaDkdJ-suq52PCO7LECKiOtBbFHtJ8Hxp2BZ0NEEp6gapBQGh95+YaxqmualrDuMaQvrh2TqI6qgtN6ZTGN43rqP+ii-NlsIqMBKiaJGzESYep4yR5gnebcqghQFGbXkpBbkEWEqidWrGSa5CacVKnn0D5ip1WggWKf1qnqQOkhaVhMU4fp8VlDSLh5M4OgqCRYLgQUgLhmZDFGGUzldeV7l9VVg2qAAomg4iiKwdAACKCAA7mgPHYhA+IUDIsCiBaiq4AAZpayAABQ-JwnAAJTkKVsb1mdTUDTVN13Q9z1vR9WJfVa2nRWSemzIy+TImZQG+BUmj-poqjfOo5SMiYtjHWViO9cj1W0Ndt1iBjr3vdeqgAKr8BAAN0GjkxwC1wnteJnVsxxp79VzEpS-dT0Cx9ovi5aku8+IcATX2U1oDNT5zUTlKOtSRjzG6jL-C0YLeO4qg-EsZRe18C6swjytKqrl1nviuCsFg566aoZ66XQACK6pgEnn3feQusS7HVtRS8VvjrohlwkUQJuAyS7VNuBjaDS3wenO8j6Ky-uwW5HPBzVofh5HWeEzHcei9juPkEwUDEH9yBm3QADCkhA8QyCmjno7zbMtL2NOwFhqBjJAZUy45MGBSOu4FMFaBKIlYrAetyrF0d2HEfIFHVt91bdAD0LGf6z3byy21amVg6tGE67Nb7KTVoqTuj9n69x-lMd+-AdZi0zrpE2GlBw8CXrpfOtI7bQlKFoVYXxy4OlpGoN0rJcicHqKcS+wClY3yDnfbmUDu7RzgZIBBH17hsAfLNQm+cnDuzdHCFY1F8JfB9BXJ0kISIMy8FXc+7hm5SR6mAryl0NYPRHmPUQE83hBQwvjXOAjXzaCcOvBECVCq6G0GCQU68WiOiRAYFYSgTAqO6hVc64DNGG20WAUe48zaqB0X9LAAU-4lgAWJeGLc1FMN8ajfxsQgl6JCWE0GAU0FmwtjpPOZjoTu0bmUVoTgdDKFdnSDQs4SgmW+LoTwnjTpt2YerFJmT9FTFqrgSYI06BA0EE-fAs9iByjNuQX6-1LSqGBqDCGUMYZwyvvE7xnM-Ho1Sborpkgel9KgAMoZdARloDnuMzSxjl7WwQLvOwCUBTckdOUEhCA-Du3DHScxDd5hGCYh0eh18EmVSSdzKehALR0AVLAWAuAYCwEMXwy2pi4rOCUDSfkwY8iuEyvvZk7tYQujdF8hcbpmmgMSRomqYKIVQphXC1Q0owCiEhXAOl9ARnqlulEkSMSgEHkBWs9uoLwXMtpbCuADKmUsuheK45ghOWiByRc7gWCCkosBHYMyGwKkLlWpZCuRgpx6CcGyWknoyWB2BZS4VNLWXivhTjNOUyAazJBlgBZUNYZxNUYKtpipqWirtfSx1eN+F2lfF8JkBRBSMgXICE+4YwThnmKoBidTd4MVAgEOh-LVlIyFRKAN0q2XwrBWAfAFY6BkBesW+13L5beq8fmv1qgi1ivpWWitVawA1vbcbXs6DpqYMudgiNRwITqG+K0QwLQ2T6odG4KcRxER7TWJuVwgRmJoEEJgeAyRG1gCReGuKuhqSbChvCEMQIShghsH4DQ1E-BlK0L85ROaYJSW1Ee2KC1OQ0mDBeowXgihJvKElaEUMviMhZMBC1N9v0r0QHCaurgSLUWZD+TcSalrxrDFuBuHoq5waBcmXpqZWwIeuduFYdNbBXoTc4eYYI1hLqUNRfQDdrFNPfS5Fpp5mzYDTDiL9+TkULWPu8loAHp1Q2hPYtFCUlhOEhm4WExG1kCbTGNQSlHxzOPIY0pk1FlhOCkYgbwvxtzapDK4ewSJ5DqaRpp1sqhKD-WQMygth7RPHvE3yWjWgvAMecGZ7IUNqTMkWMyZkRgSgX3+bmn1SMADyohCCR0GrpiNeVVC5F3KuXwGxKnLnmPkaiSIgQMk-FixzHNuLyWQFluKKxfioa-Bhqk86EBrrpluVxxh+S0jfQlj9Ta6tyRQsgQxTWFoATpnCBi3ytBMi2MuRm6LjC8n5OY1oyhaunnq5N1z7nmXOfVDNrIDNSYDd5PMWkgIXkl1TSUEuJQvhSf27JJCDXjv6k836i7CgQwOF8CBFQ07GJJqRNXRYjpQKhkXNxkbvHyVcQm7xRq-VAdvmyqm6hjpoPcgZKt6oi2j5V0nFoZErjPshuxyRX4LoIyMUneZRNJXErJrsztlKtIHM8ZAZanx1qyDY49LsZKs53HpT8ByHI-7oTekXJuHwtPhco25sNKAYvoSONB6lQUgpZdre+AUfChhmQMxMJoNX6yapa+mz5n9WRbBHAcEsWwTPgzGX-OYumhRwzfKoasW3Xmen+RGg1DsOmneIfiuGD2RRnnZUN6FwbHtGQJQ1c4MoxVkeC8YVajXvl9T8HqiFO3tAxcJTsF+NYmgNjlD3hXDY1cIJASrnZ2c4FQ8tq0VrLG15sdarUPbLNTspP2HsZRQwDSNiuMOntgXDCSOV-aZszGgsWCp28wTXzswYupseRTaEk7qbLkDEZeHfIeTzF7yC9ffMB9b4gCLZB+sNbEDgMPk+68E2sidlhCWFdhcAC0ZgZhr3vxF0gQfjYTVRMX30pEKHyBnHcUKGAnMSh0YkhH5BKEFBaBMEcCgOLxgK7ifg4TQFfkJgTiTiTmHyeQKDu022ylnBxQrm3HXiZHQLpCJxcGIIgRjlgPIPYTjkTmTjjFxnoM3EYOaBWBYMwNxVAnA0UR5G8BWCRxYgBTzVaQf1IOgQoKoLeC4SH1j2uQglZA3m9A9C213iTQ4Lx2ohKHb2W353zxX19V0MELIJgQMQoOMO3zp1MPznsA9BwIXC8GWBIlsGbwdF0GEWRFWGRGBB+GFGXwFWbU8NYWEJfj8I-m3y-noAoOHwsQcDDA9FcEKAAheWTRskK0YgYkMED34JDiEJ8O6VyMQSFh4WqD32d0pDszPRDFZH5Aq0MC60dATwZAgjWF2nwlgzSO0PURIJ5k2U6TNmHzDHXhKXKAAIqWYwglTR3nDBV2BBaGaOSVWMCW2RCWEzvHxGKK+DpnMMVxPjdBeRImrnxxnR3jiPi00MSzGyWIEP7zWIMWelFyCIjU9gKG5ybwjB+BeV8GEUnV5FSgSjUwWKSx0OgJWKf1BO6UyQiRGg2IYg9hIhMAblaBdBJz9EZCSmREFDKF5GAg3UxMBIpWWJBKuOCQMT1H2UOWGVGXOR-SuXznwTpjsyZGsl-BpJXEMHm0Yl5DXSDDz3+NGz4w5IELbSDW-0hPVSWEhEYmDDhCrggin33moV+DpAkSUC2zyHOJtUDRlWDVxDuOx1RS5EcNhDkTKAbjsK8A0EWGOB5Gyk3AdMLRFVrXpUZSdLZTlQVXdORHdne2NPhF+Ow28HRR+CcFyG9BaFSLcPSOxOWO1OdIlUCN6LjwaGrlEUNQOholC2TXyEgh0BPmrO8HDP9UjL7VLXSy7WrSjN1MrOuRcFyCSnuU9CgwUIrjQySmMA9GW2MHJItUkL1N-SjTWCrkI2oVhHMRiJuQsOMC8BW3+ApIvkCCAA */
  id: "renderMachine",

  context: ({ input }) => ({
    ...input,
    typedScenes: {},
    chatMessages: [],
  }),

  states: {
    Initial: {
      always: "Idle",
    },
    "In Game": {
      states: {
        "In Main Menu": {
          exit: "clearScenes",

          states: {
            Initial: {
              on: {
                "Warp Immediate": {
                  target: "Load Verse",
                  actions: "assignTargetVerseId",
                },
              },
            },

            "Load Verse": {
              invoke: {
                src: "loadVerse",
                input: ({ context }) => ({
                  verseClient: context.clients.verseClientForProcess(
                    context.targetVerseId!,
                  ),
                  profileRegistryClient: context.clients.profileRegistryClient,
                  phaserLoader: context.currentScene!.load,
                }),

                onDone: {
                  target: "Start Verse Scene",
                  actions: {
                    type: "startVerseScene",
                    params: ({ event }) => event.output,
                  },
                },
              },
            },

            "Start Verse Scene": {},
          },

          initial: "Initial",
        },

        "In Other Scene": {
          exit: "clearScenes",
        },

        "In Preloader": {
          exit: "clearScenes",

          states: {
            Initial: {
              always: [
                {
                  target: "Load Verse",
                  reenter: true,
                  guard: "hasIntialVerseId",
                  actions: "assignTargetVerseIdFromInitialVerseId",
                },
                {
                  target: "Start Main Menu",
                  reenter: true,
                  actions: "startMainMenu",
                },
              ],
            },

            "Start Main Menu": {},
            "Start Verse Scene": {},
            "Load Verse": {
              invoke: {
                input: ({ context }) => ({
                  verseClient: context.clients.verseClientForProcess(
                    context.targetVerseId!,
                  ),
                  profileRegistryClient: context.clients.profileRegistryClient,
                  phaserLoader: context.currentScene!.load,
                }),

                src: "loadVerse",
                onDone: {
                  target: "Start Verse Scene",
                  actions: {
                    type: "startVerseScene",
                    params: ({ event }) => event.output,
                  },
                },
              },
            },
          },

          initial: "Initial",
        },

        Idle: {},

        "In Verse Scene": {
          exit: ["clearCurrentVerseId", "clearScenes"],
          entry: ["assignCurrentVerseIdFromTargetVerseId", "updateUrl"],

          states: {
            Warping: {
              states: {
                Initial: {
                  on: {
                    "Warp Immediate": {
                      target: "Load Verse",
                      actions: "assignTargetVerseId",
                    },
                  },
                },

                "Load Verse": {
                  invoke: {
                    src: "loadVerse",
                    input: ({ context }) => ({
                      verseClient: context.clients.verseClientForProcess(
                        context.targetVerseId!,
                      ),
                      profileRegistryClient:
                        context.clients.profileRegistryClient,
                      phaserLoader: context.currentScene!.load,
                    }),
                    onDone: {
                      target: "Warp Verse Scene",
                      actions: {
                        type: "warpVerseScene",
                        params: ({ event }) => event.output,
                      },
                    },
                  },
                },
                "Warp Verse Scene": {},
              },

              initial: "Initial",
            },

            "Entity Download": {
              states: {
                Idle: {
                  after: {
                    "1000": "Update Entities",
                  },
                },
                "Update Entities": {
                  invoke: {
                    src: "updateEntities",
                    input: ({ context }) => ({
                      verseClient: context.clients.verseClientForProcess(
                        context.currentVerseId!,
                      ),
                      profileRegistryClient:
                        context.clients.profileRegistryClient,
                      lastEntityUpdate: context.lastEntityUpdate,
                    }),
                    onDone: {
                      target: "Idle",
                      actions: [
                        {
                          type: "updateVerseSceneEntities",
                          params: ({ event }) => event.output,
                        },
                        {
                          type: "saveLastEntityUpdate",
                          params: ({ event }) => event.output,
                        },
                      ],
                    },
                  },
                },
              },

              initial: "Idle",
            },

            "Player Position": {
              states: {
                "Position Queue": {
                  states: {
                    Idle: {
                      on: {
                        "Update Position": {
                          target: "Idle",
                          actions: "assignNextPosition",
                        },
                      },
                    },
                  },

                  initial: "Idle",
                  exit: "clearPositionQueue",
                },

                "Position Upload": {
                  states: {
                    Idle: {
                      on: {
                        "Registration Confirmed": "Ready",
                      },
                    },

                    "Update Position": {
                      invoke: {
                        src: "updatePosition",
                        input: ({ context }) => ({
                          verseClient: context.clients.verseClientForProcess(
                            context.currentVerseId!,
                          ),
                          position: context.processingPosition!,
                        }),
                        onDone: {
                          target: "Ready",
                          actions: "clearProcesssingPosition",
                        },
                      },
                    },

                    Ready: {
                      always: {
                        target: "Update Position",
                        guard: "hasNextPosition",
                        actions: ["consumePositionFromQueue"],
                        reenter: true,
                      },
                    },
                  },

                  initial: "Idle",
                },
              },

              type: "parallel",
            },

            "Entity Registration": {
              states: {
                Initial: {
                  always: "Registering",
                },

                Done: {},

                Registering: {
                  invoke: {
                    src: "registerEntity",
                    input: ({ context }) => ({
                      verseClient: context.clients.verseClientForProcess(
                        context.currentVerseId!,
                      ),
                    }),
                    onDone: {
                      target: "Waiting for confimation",
                      reenter: true,
                    },
                  },
                },

                "Waiting for confimation": {
                  after: {
                    "1000": {
                      target: "Done",
                      actions: "sendRegistrationConfirmed",
                    },
                  },
                },
              },

              initial: "Initial",
            },

            "Chat messages": {
              states: {
                Initial: {
                  always: "Get message count",
                },

                "Get message count": {
                  invoke: {
                    src: "loadChatMessageCount",
                    input: ({ context }) => ({
                      chatClient: context.clients.chatClientForProcess(
                        context.currentVerseId!,
                      ),
                    }),
                    onDone: {
                      target: "Idle",
                      actions: {
                        type: "assignChatMessageOffset",
                        params: ({ event }) => ({
                          messageCount: event.output,
                        }),
                      },
                    },
                  },
                },

                Idle: {
                  after: {
                    "1000": "Check new messages",
                  },
                },

                "Check new messages": {
                  invoke: {
                    src: "loadChatMessagesSinceOffset",
                    input: ({ context }) => ({
                      chatClient: context.clients.chatClientForProcess(
                        context.currentVerseId!,
                      ),
                      offset: context.currentChatMessageOffset!,
                    }),
                    onDone: {
                      target: "Idle",
                      actions: [
                        {
                          type: "updateChatMessageOffset",
                          params: ({ event }) => ({
                            messages: event.output,
                          }),
                        },
                        {
                          type: "notifyRendererOfNewMessages",
                          params: ({ event }) => ({
                            messages: event.output,
                          }),
                        },
                        {
                          type: "appendChatMessages",
                          params: ({ event }) => ({
                            messages: event.output,
                          }),
                        },
                      ],
                      reenter: true,
                    },
                  },
                },
              },

              initial: "Initial",
              exit: "clearChatMessages",
            },
          },

          type: "parallel",
        },
      },

      initial: "Idle",
    },
    Idle: {},
  },

  initial: "Initial",

  on: {
    "Scene Ready": [
      {
        target: ".In Game.In Preloader",
        guard: "sceneKeyIsPreloader",
        actions: "assignPreloader",
      },
      {
        target: ".In Game.In Main Menu",
        guard: "sceneKeyIsMainMenu",
        actions: "assignMainMenu",
      },
      {
        target: ".In Game.In Verse Scene",
        guard: "sceneKeyIsVerseScene",
        actions: "assignVerseScene",
      },
      ".In Game.In Other Scene",
    ],
  },

  entry: "activateGameEventListener",
  exit: "cleanupGameEventListeners",
});
