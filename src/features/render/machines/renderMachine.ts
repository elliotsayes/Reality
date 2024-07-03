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
import { ProfileInfo } from "@/features/profile/contract/model";
import { TrackingClient } from "@/features/tracking/contract/trackingClient";
import { LoginResult } from "@/features/tracking/contract/model";

export const renderMachine = setup({
  types: {
    input: {} as {
      playerAddress: string;
      playerProfile?: ProfileInfo;
      initialVerseId?: string;
      clients: {
        aoContractClientForProcess: AoContractClientForProcess;
        profileRegistryClient: ProfileRegistryClient;
        verseClientForProcess: VerseClientForProcess;
        chatClientForProcess: ChatClientForProcess;
        trackingClient: TrackingClient;
      };
      setVerseIdUrl: (verseId: string) => void;
      onUnauthorised?: () => void;
    },
    context: {} as {
      playerAddress: string;
      playerProfile?: ProfileInfo;

      initialVerseId?: string;
      clients: {
        aoContractClientForProcess: AoContractClientForProcess;
        profileRegistryClient: ProfileRegistryClient;
        verseClientForProcess: VerseClientForProcess;
        chatClientForProcess: ChatClientForProcess;
        trackingClient: TrackingClient;
      };
      setVerseIdUrl: (verseId: string) => void;
      onUnauthorised?: () => void;

      cleanupGameEventListeners?: () => void;

      currentScene?: Phaser.Scene;
      typedScenes: {
        preloader?: Preloader;
        mainMenu?: MainMenu;
        verseScene?: VerseScene;
      };
      loginResult?: LoginResult;

      targetVerseId?: string;
      initialVerseState?: VerseState;

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
      | { type: "Login"; verseId: string }
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
    assignLoginResult: assign((_, params: { loginResult: LoginResult }) => {
      const { loginResult } = params;
      return { loginResult };
    }),
    showLoginResult: ({ context }) => {
      context.typedScenes.mainMenu!.showLoginResult(context.loginResult!);
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
        playerProfileInfo: context.playerProfile,
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
        context.playerProfile,
        verseId,
        verse,
        context.clients.aoContractClientForProcess,
      );
    },
    assignTargetVerseId: assign(({ event }) => {
      assertEvent(event, "Warp Immediate");
      return { targetVerseId: event.verseId };
    }),
    assignInitialVerseState: assign(
      (
        _,
        params: {
          verse: VerseState;
        },
      ) => {
        return { initialVerseState: params.verse };
      },
    ),
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
    onUnauthorised: ({ context }) => {
      context.onUnauthorised?.();
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
        if (messages.length === 0) return {};
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
    clearChat: assign(() => ({
      chatMessages: [],
      initialChatMessageOffset: undefined,
      currentChatMessageOffset: undefined,
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
    isAuthorised: (
      _,
      params: {
        loginResult: LoginResult;
      },
    ) => {
      const { loginResult } = params;
      return loginResult.IsAuthorised;
    },
    noLoginReward: ({ context }) => {
      return !context.loginResult?.HasReward;
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
          profileInfo?: ProfileInfo;
        };
      }) => {
        console.log("loadVerse");
        const verse = await loadVersePhaser(
          input.verseClient,
          input.profileRegistryClient,
          input.phaserLoader,
        );
        return {
          verseId: input.verseClient.verseId,
          verse: verse,
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
        console.log("updateEntities", entities);

        const profileIds = Object.values(entities)
          .filter((entity) => {
            return entity.Type === "Avatar";
          })
          .reduce((acc, entity) => {
            if (entity.Metadata?.ProfileId) {
              acc.add(entity.Metadata.ProfileId);
            }
            return acc;
          }, new Set<string>());
        console.log("ProfileIds", profileIds);

        const profiles = await input.profileRegistryClient.readProfiles(
          Array.from(profileIds),
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
          profileInfo?: ProfileInfo;
        };
      }) => {
        const verseParams = await input.verseClient.readParameters();
        const msgId = await input.verseClient.createEntity({
          Type: "Avatar",
          Position: verseParams["2D-Tile-0"]?.Spawn || [0, 0],
          ...(input.profileInfo?.ProfileId
            ? {
                Metadata: {
                  ProfileId: input.profileInfo.ProfileId,
                },
              }
            : {}),
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
    trackingLogin: fromPromise(
      async ({
        input,
      }: {
        input: {
          trackingClient: TrackingClient;
        };
      }) => {
        const result = await input.trackingClient.login();
        // return {
        //   IsAuthorised: true,
        //   HasReward: true,
        //   Reward: 100 * Math.pow(10, 12),
        //   Message: "You got a reward!",
        // };
        return result;
      },
    ),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCcwDsJmQWQIYGMALASzTAGIBlfdMAAgCUxcIBPAbQAYBdRUABwD2sYgBdigtHxAAPRAFYAnAEYAdAA51igEy752gMyL5WgDQhWiALTL1qgGzqDB+-ZcAWAOxL7n9QF9-c1QMLDwiUgpqWkZmNnZlXiQQIRFxSWk5BGVtRU9VThU85WNteUd3c0sEGztHZ1cPb0V7HUDg9EwcAhIyKhoyWJYObSSBYTEJKWSs3QN85WV7eU53Q04lRSrrWwcnFzd7Lx8j9pAQrvDeqIH6JmH2AzGUifTp0Cz3Tl9VA3d5AwrTycTzabzbGqKVTaXz2ZTfdzLYGKJxnC5hHqRVQASTQk1wABtyFxnqlJhkZogwVD5O5NJ4DOptIUUcYIWD8vYwZwjOpVvIGQY0Z0MREyDi0HQAOK4AC2YAldDwpCV6AArhL8USAOq4ZD8OjY2XyiDEXCiMAk6Rkt6ZRDKAzw1RKdyLQzaJmOrYWBTqNSKP5+XSeRReb7C0LdMUK3HSuUxyXKxPq1SUQiCADupCgdAAMoIoCqmLA1QTRKp8yw6AA1LCwCgQSQK0gAN0EAGsFeio9dFTL5Yqk6q0Bq05ns3mC0W4KXy5WIDW62AEK3BPhzVMSVbkjapnbsn97AU-ooVGV5MpPO5vdVFipoUYweUviswRHLpjxbH+wmlbgVdgKZjlmaA5vmhaSsWs6qLWyD1kMbDkLq+qGsakBmha27jGke6UtkrhHoyrquE4rTAgYEIOvI8jOp4QaFNRoYMu+oq9t+8aDv+yYjqm6YgWBU6QTOZYwUuCGsMSPDWq8uEfPadJqLY3wbH8iLfNolHzDR7jXpo+iBvC9gsT2WLsQOsZDoBPEACrIAQ7YTuBpDkI24qrp2qjdlcpmSj+nEASmtn2Y5gkrmgbbrm8W5STuMkUnJ2Qwvk6jXs+fghr4EJ+jRKJOHybjuM4izGd5X6+RxFlccOGpBfgDmgZOEEuU2qjuV2IomWVcbmYmVVWTVdl1SFEFhRFG6SFuiTSTh8WyPa9icJwvwEYo3wuqsN6IOo5SqMYXwEdRgLqJ4JWfr+fmxgACqgBKCCwWCauIhKSaScXvHNCC0nUywOjkGzUhRPoIEcS0GCC8ycLkuhfIop3Rn2FWStdYC3fdyCPWaRIJK9M3vVk6hchoayOBejLHUcEJHO4DiOjCXK+GC15w2x5U9XQyOo10FZ3QusH1s1bnhR27WRqV52I+zN08w986LnBy6rpFm48FhLy4-uC1qNR2h0vo2g5HSgPVMddgAvMLQCqeizuMzPndb+fP0NE4rIfw2YY89ruoSaGGWjF2HknjVIOnYeQeo6ygAmsm0IJ4SwPi4ngM0nzLKLbXUXZKjt0M7Cqu+7suOwLzZCx5XlnQjbPZ7nqj56B3NVo7o1ruNaDRTjgf7vr17OmsILbfSjQQkxvzlM4QYejrQpBOcHVi5XDtiTXACiaDiKIrB0AAIpmaCcziEAEhQMiwKI5oKrgABmFrIAAFPCi0AJTkOX8NmYv8s57cqir+vm87xmPePMD5H1VruWasw45qCSoYEwoJPAQjjgYVQV46KpW+HCEo6dxZVyXt-X+Yh-6733gAVX4BAc+dACHiDgMXVqpcRYfjfqzD+8EV5r0IdvYhwCyEUItFQjhNDYDNyVhNFW-s1adzwjrBkvxcpUT8EyZQiCQyqEKpwP0Gj4R0VODPV+LN7aKmrt-S6BJcCsCwOzN6qhLpvToAARTVGAJxICKC8MobY3GYC3pd30NpI4YNHRKBMPYTSAoNDkRMHMFoSxsELyMXg2gNizEWOQFY3GNi7FkP3tiQ+FAmCFlPnZN4dAADCkhL7EGQCabx6tpHHVBhscmWgWh+lCUDB0OtfiFThFyZ8kMbZ6LnhXd+CTP411MeYyxnjA6ZNxnQbJPDyEeLenQtqnlhnMMMbGYxSTJmpPSbMmZJTFksFUO4-hxypgiNbu3aaUiEoelkYyZkJgNFcm2ggjp5QjyulWsoLwSwQwmDiaMnZiTxT7OmdYq5kgFn8H3vcRCtSHkfSCXYDRFtqIArpO028aw6iaK+IyRYLzQUsLGWw-BgjN4FOIEU1uHssYSPAUHBAjoFq-BDDoQqfgQQOkppDaEq04GnlWmCIyQzRYjIpeC8Z1K-6xEKaIYpUxVB0tPlgbMayGEbOlVszOcsqVJOobSsAyrVWSHVea+lN9sw3KiuIjuto8Jg00M6P4Lh9YhjojrFR1NU6Mg2JDai-xyXbKzhChUpqlW2stWgWu-5xANUvoINJ+AKnEFlK3cgJ8z4WlUFfG+99FqcGfvou2hrdnihjRqlVjLdSTBTWmugGa0CVOzY651sk0XzG0BoSO5QAXwmIllQoaiUqcABcyb1l5w1VqjaoUphBzR0HlLAWAuAYCwCZS9e5LqEouCcM6AmI6WgwgvJRXQUIk46ADAGRkOhJUdH1QYhd8qknLtXeuzd27VBSjAKINdcBf30AzWqNeOq2xl02W+iW1aFRfqAz+rdcB-2AeAxu1DrbBAQdEA65W3AUUHrRQtft+tyh5D+JPRElE+7OmogMhaRg05SqYXB3BH7xRIcw6BnduSj65tPufQt18sAlqfi-WDlb4OLp4yhv9Am-bdogYgINR51J0hRO6JkXzbxjwKFAj0rQlCQ2fbPV9MnOPGu4yu5DIHUM7uXWAOqdAyAZl445qDws9Xsas6wp2395MOb-c51z7nPPboI2IojLKfGupaMlREPqlCM2WJRVwS0qPMkxQ6CogQZ5oEEJgeAyQK1kH3T22YuRnSnkWgCJiRQIQ2FUbYZwcDKMBl0S+vzZUtSVdUwgDktXVoqUayUSiO08gLR5IVPkdWTpsdYv5gbbL-j9tcKTP6+gQxG3klCLQKlAz5WZAEJbnUcG-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 */
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
                  target: "Tracking Login",
                  reenter: true,
                  actions: "assignTargetVerseId",
                },
              },
            },

            "Showing Login Result": {
              initial: "Load Verse",

              states: {
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
                      profileInfo: context.playerProfile,
                    }),

                    onDone: {
                      target: "Verse Ready",
                      actions: {
                        type: "assignInitialVerseState",
                        params: ({ event }) => ({
                          verse: event.output.verse,
                        }),
                      },
                    },
                  },
                },

                "Verse Ready": {
                  on: {
                    "Warp Immediate": {
                      target:
                        "#renderMachine.In Game.In Main Menu.Start Verse Scene",
                      actions: "assignTargetVerseId",
                    },
                  },

                  always: {
                    target:
                      "#renderMachine.In Game.In Main Menu.Start Verse Scene",
                    guard: "noLoginReward",
                  },
                },
              },

              entry: "showLoginResult",
            },

            "Tracking Login": {
              invoke: {
                src: "trackingLogin",
                input: ({ context }) => ({
                  trackingClient: context.clients.trackingClient,
                }),
                onDone: [
                  {
                    target: "Showing Login Result",

                    guard: {
                      type: "isAuthorised",
                      params: ({ event }) => ({
                        loginResult: event.output,
                      }),
                    },

                    actions: {
                      type: "assignLoginResult",
                      params: ({ event }) => ({
                        loginResult: event.output,
                      }),
                    },
                  },
                  {
                    target: "Unauthorised",
                    reenter: true,
                  },
                ],
              },
            },

            Unauthorised: {
              entry: "onUnauthorised",
            },

            "Start Verse Scene": {
              entry: {
                type: "startVerseScene",
                params: ({ context }) => ({
                  verseId: context.targetVerseId!,
                  verse: context.initialVerseState!,
                }),
              },
            },
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
            "Start Verse Scene": {
              entry: {
                type: "startVerseScene",
                params: ({ context }) => ({
                  verseId: context.targetVerseId!,
                  verse: context.initialVerseState!,
                }),
              },
            },
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
                    type: "assignInitialVerseState",
                    params: ({ event }) => ({
                      verse: event.output.verse,
                    }),
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
                      profileInfo: context.playerProfile,
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
                      profileInfo: context.playerProfile,
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
              exit: "clearChat",
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
