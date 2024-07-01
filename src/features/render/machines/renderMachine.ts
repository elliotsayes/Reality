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
    isAuthorised: (
      _,
      params: {
        loginResult: LoginResult;
      },
    ) => {
      const { loginResult } = params;
      return loginResult.IsAuthorized;
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
        return await input.trackingClient.login();
      },
    ),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCcwDsJmQWQIYGMALASzTAGIBlfdMAAgCUxcIBPAbQAYBdRUABwD2sYgBdigtHxAAPRAFYAnAEYAdAA51igEy752gMyL5WgDQhWiALTL1qgGzqDB+-ZcAWAOxL7n9QF9-c1QMLDwiUgpqWkZmNnZlXiQQIRFxSWk5BGVtRU9VThU85WNteUd3c0sEGztHZ1cPb0V7HUDg9EwcAhIyKhoyWJYObSSBYTEJKWSs3QN85WV7eU53Q04lRSrrWwcnFzd7Lx8j9pAQrvDeqIH6JmH2AzGUifTp0Cz3Tl9VA3d5AwrTycTzabzbGqKVTaXz2ZTfdzLYGKJxnC5hHqRVQASTQk1wABtyFxnqlJhkZogwVD5O5NJ4DOptIUUcYIWD8vYwZwjOpVvIGQY0Z0MREyDi0HQAOK4AC2YAldDwpCV6AArhL8USAOq4ZD8OjY2XyiDEXCiMAk6Rkt6ZRDKAzw1RKdyLQzaJmOrYWBTqNSKP5+XSeRReb7C0LdMUK3HSuUxyXKxPq1SUQiCADupCgdAAMoIoCqmLA1QTRKp8yw6AA1LCwCgQSQK0gAN0EAGsFeio9dFTL5Yqk6q0Bq05ns3mC0W4KXy5WIDW62AEK3BPhzVMSVbkjapnbsn97AU-ooVGV5MpPO5vdVFipoUYweUviswRHLpjxbH+wmlbgVdgKZjlmaA5vmhaSsWs6qAAwrgkqUKIeqiIuyD1nQ0R9Lq+qGsakBmha27jGke6UtkXJ2MY+iePC8jUS0EIOnS0JHDk16ug07jvqKvbfvGg7-smI6qAAKsgBDthO4GkOQjbiqunaqN2VxYnxA6xkOgHCWJElSVOaArmgbbrm8W48NarykR89owvkmhfKszL-IiBgQuo5SqMYXyuMsAImJ43E9qpko-gJAEpjp+CSaBk4QbJTaqApXYikFX4hfxGmCcOGqRdFYH6YZxkbpIW6JBZJEUtZ5GcJwvw+Yo3wuqsN6IO5R5ed8rh0YC6gBUE5wpSpaVxupkoAAqoASggsFgmriISxLmTulmVbICjMV1Do5Bs1KuT6CBHLVBggvMnC5LoXyKIFQ2-qFsYTWAU0zcgc1mkSCSkit7xrQg6hchoayOBejK9UcEJHO4DiOjCXK+GC17XZ+t0ZeNk3TV0Fbo6h9bxfJRkdslkY3X2KN0A9T0Y-O2PLquJmbjwREvBV31ZPYnBqHR2h0vo2hsU4bl+M6zghkip6LFx-XKUjJOjdTGG3Ko2H8Nmr0LUruEmgRlpLcR5Is1SDqUaCTiLACawtQgNFHoYLieHDdvMsoiPRjLv61mh9CYQqSsq1T7s43Jzb44pUsu2pbtLvLtCK3qyugZjVb+zT+N0yVDM60zev7rz17OmsILufSjQQqG+SAm48xMh6XNCpLg3S+HipJ1H4oAKJoOIoisHQAAimZoBTOIQASFAyLASEWqouAAGYWsgAAU8I1QAlOQoe8elsvN17qjt533d9xmA-o0PI+M7uq2zDRai2YY-lghCNEGKoV6eFexidXezsbyNEcey3Co95iAPv3QeABVfgEBzT0CAeIOAuMg5thDvXMOm8-7oR3rAkBR9wGQOgXQWBxA4CFTXMVNAZlPrM2zl4Z+vI-SAj8EyZQj8QyqHcMdP0nBOFv1OHXImDc0FN0jjvMaBJcCsCwGTL6qgxpfToAARTVGAJRp8KAQKgRaKRzNz5fWzvoeQbCjjHUdEoEw9hGIMI0MCHqcwWhLG-sFX+Qj-4iLERI5AWi9YyLkRAwe2Jh4UCYIWce4k3h0BgpIaexBkAmh0VQsiHpgS-A2KDLQLQ-TmP2g6Lmvx2Fwi5M+M6EsOj8NQU42M28FaiPEZI2RzNvHMzoL4k+6j8F1L1ggxKwdCYfjKXdSUlTo7VPcZ4t4DS9ZNP4LgjR9B2lvBIanch6dKFZwSb1WhTIUlcIogKRi5QjyugasoLwSwQwmAccNfpctXE1I8XMqY4ywnNJYKoe4bBForNtGRExdguEtDohedwdJMm3jWHUThXxGSLEZNoC5yMt7CIVlg2IwTRChIebiLUHzyqrKqo6NmvwQw6HYX4EEDpwZnWhA1fyp4GpgnsHC12ziMFIo7sAlFxAQlkNeWAVFWBsydKSkpFBP8rmDLbmyruHKuVjKCZyue2YFlkIoTir5eKuF2DNi4XmIY35cxYZDR2jINhnTov8RljcKmIujsiuVMqHm6kmDFaeggPH4EicQWUZDyBjwngqGec9F41U4KvdejixXWolfvaVaLuWOvEM611dB3VoCiV60yGcL76wQMLbQGhlB0ThK6VYSw3KFDYeoL4xzmQ6svBawRVqXEKxgoQc0dB5SwFgLgGAsBVbvUzbo759RnR-XhNeWGF5GK6ChHbHQAYAyMh0AyvhvTRWk3FQqFtbaO1dp7aoKUYAUI7u7fQd1aoO6Cu6cK0pa6EVNujluo9cBd1wH3Ye9tz6T3JsEOe0QSqM3cDibin6LhKW83KHkP41dESMXzs6OiRS2ZGCdiuni4b12Rs3a2p9naT29v8SPH149oFT1nlgINK814ivQ3ellD7sMftw3ugj2tPlWRA3yI83wuZaE9NXTwey3AFGvh6VoSgzrLpKaumj6DPbNoY8evdLawBRToGQDMjGX2wEvUgnpaHLkYfveKR9mm8OwUICp9samwAacU8Q2myrlmqvY1kIwPxK2+DyEoeGyxGKuFqpB5kfyHQVECP1NAghMDwGSGGsgznL5UlyM6U8NUASlyKBCGwrDbANErbkNYSg+pSf0wmLU8Xs0cmSw1DYRgvAZayR5PIbMeTsL5ClorA0b0yfK-uf4ebNrQx2iGPaoKoRaB5H9AUwIBS0nreUxMWUtJqh62RHIJQNCVpqvnZybgIQuHBYsHITDLwFrm1czSKZMXzQJCtqqIXaomEMFyakJh-gQhWM-WwpsHI8kKB12L8LfwXeEsBPSEFYgljLLdn6OQUTHmvGeOil5rwl0cFSwtV4vB-TfKh1KgOwpCVHOmEC+VwdQTLAnBcSdodZAdACTyjg2uGD8JeEF9oNgGLOWsO23hTUBFx8TS1C3wog+J2D6ckPyxwQQkhZAKEN00-tPkgGj3FiCmBAJrJOdfh05roCXIbgzuk2BzlcSUVxffSzfuB0XDCX5z+uOvIj9eZsNft4Rwug2b8+K3jplmURcajAWgXAapRDpmQJyyAivyI-BKFRM6fJATyEfgSrwyxESFvNrCgXAj5t-gD6mWX8vMPR+OQKDbl0DBc2rlX2DDINBPbthqrQuQjeywAPJh8kV7aPQL3KGOOE+YwgI9vfGhLSf4hWVC0iujnvppNyboywNHlYtUBvbXoiNxA5sChaC5An+Ps+feC4bajR6S+XpXbetHw6bD-hXm6rx3I72hMmA-sa0TKg2+-kX89QvyF89Cdo93J8hcgTAeR5haQnxH4WgX4SgRYSgTxWhv9FRf8MZEIACFdlp4kqoXQHBfAGQQwlhiULZ4RdBVBDswxucjgBQUD7o0Y-8-YlwV8GoX5vhjljUuQGQLYH8ChskXwW83B5A6CAkV8nR2ZHtrxK02IC09tjkKCAQ2ZRM9VaRhC59b1ZMAFo8nI808gPRHQC0oMLZmdfgGovggVgRVgC46CBlMMY59RsxtDCgAtjYDCzZn99p9kHwnB3RNATwUNj9c8I0jNvZY4VYr9CRtDbA6heYPQ-JwCXBwZ6cGQnBXQvtnBDAbDrkFYfZ44mCPYoijAKC8h2C-AjhbI3JjpDEiVK1HRvB-tqMDNaM5No5cioB7CDQsDdY1Ufoc480QszYapjlZCskQR8gBRdBbBzxQRilOtpMmjNDMFJVsFj4WBtCCtTDNA6dGFeYX8oRGQuQ1coV9BZiAc-dbCQjd5lje5QET4WNtDqIX44YepQRNdqhlgjxNBnsWgDDy4siN0rjo1D5ViIBVBWlNFCE4BtDecCgYQtimFCCWEDFjBpt51SU2h1CZNmUWjxRhlalB1uiXMqQ1g1BHJLDRMBRSCQRIZjpzxWhx0-R-i7C8S7lpF7lJAFElElF1jWgChucaoKSQxGIlg1A+Qygrw8tXAgUmTLiWTRkHl2TJRFFlEYxRDsDgNZgLx8gySBTJshStdYDaT-gnA6IUQygZS6NcS3F8T6lFTJkKZtCq5kl-JHBTxHBS0skRSNBOYx1ERlgj85iStzjsihlrTWTbSfEpk7i1TCSEsEB8s1BF1vA4jChWg3ibJc4k9dB9gWg1gLScSFQ5TFTHkph7SWk8FNFFTo98U18HY-Q+QZ9LxBNn49874jBqSGR8yAEZEwz5TJASyOTnlQS3lqhYyKsF0HBg0AwSgQC3sskgVST8lqQa0dA1DAj59mjuzbVeV5V0VVordvkrChY8kdU8gZiIQgUxszCyUDiGRs91yNDsStzri7VY0xkIibt1SejXMC07B2Eao-QAwtAPB3t5hTDHIPslhnwuyljo1Xy9y0BVA+44svyiSc0NjGoXAoLvImz9pWgoQOJeYmQM9vBvdAzfchcQyo12V4LuVXz+VQJqzCg7AC1XAGo7Y6RrFwYjhx8Zs-QLwVhK0YLWU4Kdz7V+z40JwXU3UPV012MDz1UAxDElBnAUR5gzC3JmI34vhxs34kdhL6Nt1P0e1qzaQjoENTxjY-ttBGIJsHAvg34rxvgzoPQDLjMFNjLX0Pzqz3SoYuRrwaJi1fBhT69jlOpChEC0i3KsMjKmNX0D0cMX1v1f1TLNBfgLK9C2tQQLEapPIyDXTERsyAjyKT888ASTM7N8MYzM5vzEB9sDk2ZV8gK8h1BBM81uD4RTxNkVLorzNYqtNzNLNrNbNPLosxz9wjB6cUQ4R9hjpLwAw9kiiq88kXIQx9gLVqqFLeimQ2F3RLxjoIYPRKh9peRPJaQgw51lg2owt-AgA */
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
                      target: "Can Start Verse Scene",
                      actions: {
                        type: "assignInitialVerseState",
                        params: ({ event }) => ({
                          verse: event.output.verse,
                        }),
                      },
                    },
                  },
                },

                "Can Start Verse Scene": {
                  on: {
                    "Warp Immediate": {
                      target:
                        "#renderMachine.In Game.In Main Menu.Start Verse Scene",
                      actions: "assignTargetVerseId",
                    },
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

            Unauthorised: {},

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
