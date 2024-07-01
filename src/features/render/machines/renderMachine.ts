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
        //   IsAuthorized: true,
        //   HasReward: true,
        //   Reward: 100 * Math.pow(10, 12),
        //   Message: "You got a reward!",
        // };
        return result;
      },
    ),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCcwDsJmQWQIYGMALASzTAGIBlfdMAAgCUxcIBPAbQAYBdRUABwD2sYgBdigtHxAAPRAFYAnAEYAdAA51igEy752gMyL5WgDQhWiALTL1qgGzqDB+-ZcAWAOxL7n9QF9-c1QMLDwiUgpqWkZmNnZlXiQQIRFxSWk5BGVtRU9VThU85WNteUd3c0sEGztHZ1cPb0V7HUDg9EwcAhIyKhoyWJYObSSBYTEJKWSs3QN85WV7eU53Q04lRSrrWwcnFzd7Lx8j9pAQrvDeqIH6JmH2AzGUifTp0Cz3Tl9VA3d5AwrTycTzabzbGqKVTaXz2ZTfdzLYGKJxnC5hHqRVQASTQk1wABtyFxnqlJhkZogwVD5O5NJ4DOptIUUcYIWD8vYwZwjOpVvIGQY0Z0MREyDi0HQAOK4AC2YAldDwpCV6AArhL8USAOq4ZD8OjY2XyiDEXCiMAk6Rkt6ZRDKAzw1RKdyLQzaJmOrYWBTqNSKP5+XSeRReb7C0LdMUK3HSuUxyXKxPq1SUQiCADupCgdAAMoIoCqmLA1QTRKp8yw6AA1LCwCgQSQK0gAN0EAGsFeio9dFTL5Yqk6q0Bq05ns3mC0W4KXy5WIDW62AEK3BPhzVMSVbkjapnbsn97AU-ooVGV5MpPO5vdVFipoUYweUviswRHLpjxbH+wmlbgVdgKZjlmaA5vmhaSsWs6qLWyD1kMbDkLq+qGsakBmha27jGke6UtkrhHoyrquE4rTAgYEIOvI8jOp4QaFNRoYMu+oq9t+8aDv+yYjqoAAqyAEO2E7gaQ5CNuKq6dqo3ZXFi7EDrGQ6ATx-GCcJU5oCuaBtuubxbjw1qvLhHz2jC+TqNez5+CGvgQn6NEok4fJuO4ziLCxPZyZKP6cQBKaqfgQmgZOEFiU2qiSV2IqeV+3kcYpXHDhqAVBWBGlaTpG6SFuiSGThFImfhnCcL8BGKN8LqrDeiDqOUqjGF8BHUYC6ieB5smxXGCmSgACqgBKCCwWCauIhLEgZO5GQVsgKHSDjLA6OQbNSFE+ggRwlQYILzJwuS6F8ijtZ+v4+bGfVgANQ3ICNZpEgkpJTe8M0IOoXIaGsjgXoyrVHBCRzuA4jowlyvhgteR3Rn28W9f1g1dBWcOLnBDbhZF0nRR1J3Q3Q52XfD85I-WGVrllaD6Q9+VPVk9icGo1HaHS+jaDkdKrdUrV2AC8wtAKp6LO4ENsXF3WE-Q0Tish-DZjdY2S6hJoYZaE3YeSVNUg6dh5B6jrKACazVQgnhLA+LieKDZvMsogteV1v6wfB4sKpL0sE-bKMSdpHZRZGmNQyLbt0I7qjO6BCNVm7xO6ZuPBYS8lP7sz17OmsIK1fSjQQkxvzlM4QYegzQpBOcGPHX7dtLoHtyqAAomg4iiKwdAACKZmgeM4hABIUDIsCiOaCq4AAZhayAABTwsVACU5AyaX8nl8jle0DXddiI3LcZm3cMd13se7tNsxG2oZmGCYoKeBCRsGKoV50ZZ3xwiU1udadkoB0Htf1+vrftwAqvwEB+50E-pMOAYUPZtikrPSG89FTvyriAhuzcf7b3-oAi0wDV7iDgJHUm5M8qqwTl4a+vI-SAj8EyZQl8QyqFcpwP09D4R0VOEXaBQtbZwIrkHHqBJcCsCwDjR6qgeqPToAARTVGASRO8KBoKASIyme9HoJ30DRREdDHRKBMPYSi5CNDkRMHMFoSxn5Y39lwquPC+ECIUarYRoj-7t2xJ3CgTBCy9wEm8OgABhSQg9iDIBNEo+OeEPTAl+BsH6WgWh+h0WtB0DNfiuThFyZ8u0BasJLjA4WC8HaWN4fw5AgjKb2MpnQRxqCAHyMeuA5snsoFZPYa-UWS9xRWMKcUuxtivEVJYKoORGDulTFwXpGOys46ENCa1EhTJIn0K5LVC+8TyhHldOVZQXglghhMKYsunDF7cIKTYoRQzJDlP4O3e4iFgmTMKpouw9CebUQ2XSOJt41h1AYV8RkixGTaF2bA2M8Dl6IMbm44gHjSYyzuuM-easECOhpr8EMOhXJ+BBA6P6u1oTlTPqecqYJ7AApyfsvJIKsFgrAO40QnipiqHBb3LA2ZakRXqd7D82SOFAoseSr+sRqW0skPSqlEKR7ZhGdHbgNzbR4S2poZ0fwXDMxDHRBm1CAaW0ZBsXa1F-jEq5W-Hl4pQX8tFYKtAwd-ziGCoPQQRT8B+OILKUm5Ae59wtKoIeI9x7FU4NPNhNtmnAuNRS01kK3iWsmDau1dAHVoH8c60ZFNbnPVztoDQutygbPhMROyhRaEWVpinZVl59VBqNQqbxhBzR0HlLAWAuAYCwGheNZNMq7n1GdK9HNLQYQXkoroKEZsdABgDIyHQRLMk+zniS7lByq5VprXWhtTbVBSjAKIWtcAV30AdWqOuLK0YBpftjYNlbq2buXY2uAa6N1bvrde2Ngh92iAldlMZbbjKpppum5m5Q8h-HzoiSiKdnTUXSTTIwVsp0cqaaeitqhF2Xu3de5tziu6ut7v3T1w8sA+qnjPRpgb4PzuXkh+9O60MuOlV+rIWqjzfAZloT0+clm3hzgUI+HpWhKF2pOjo07OXltI+KcjV7V1VrAIFOgZAMwUdQ4etl6NBNwfMSJ89S6UMScIFJ9sMmwByfEzg1cUd31Sthco2VLRzKIhVUoMGyxKKuBKgB5kjyHQVDLdjJSQF0wgTShBWIJYywwQrlc1graCHtuehsv0qhbDfA2H8REjHdHeFodeTQ+hAzwknUXNAghMDwGSMesAUXaNUlyM6U8xUARMSKBCGwNDbDOCZPoZJfhiVanKwfKkdFqvlSS-VkolE6p5BpjyVyfIattRg6xYj8oevwv+Om1wX0lr6BDGze0SctA8hRN4JhCyvMix8yOJb+4cglHesYI41lrMQhcJ8t0TIVCTZMXNmKZjfxnY1Librk0QmFQ8yVQxSrqQmH+BCFY19bCLFpL6raeQTs-cSspUcfn1KBagmWC7eEcgomPNeM8zyrwGx0MfBqrpcjJKUCj3y3EMfjmCiJSCM4QuuyXHj4HgJr4xOm4YPwl43n2g2DRbZawzbeB1QET7vtAWJjR755nAXpzBfLAHcL3OYspPeoYxYgpgRsdMhs34VEC6AlyG4enCU-IqQEoFLHpBtdZAdN8aEDIvhrEZEqyoa1gRqG8LMlo5U3DURt4ru3Gpf5oFwGqUQ6ZkAQsgC7+0rgFinnAx6Hk1FL5Iq8MsRE1Ejh7Qj3+KPqY+7IE3We1P2R-jmULQGBm+cDDaBAwyDQhhYT0M0COsvAB5BPAjHZ1-cIzWhd3NtaMBI993ZRx+MRDLrcGcuZ0GpxrDK6deVglTW4tZkm2AwQn1gULQF4ry6GZCofjxcVMLd-LjOGw1-ujQJHXjaGWBT-ABMx3I0O3Au1jAeQ+RuMVAy8n8rpK89RN1fs69FkcUTAeR5haQnxL4Wgb4SgbISgTxWgICt94ZKAq8a8K0d9Qx5o6JuYlhUUDZ4RdB4t+ZgRJcjgBR8CLpn9rpOdkYyCSpgQ4QptGMGQDYrwaJaY28XwtAYRAQbcXEd8nRaZDFMtqdXR5BHtTddYXBdpXpVVaR5Ay9a9AcU1ZhVh00tYnB4dAMDZBdfhypeQ4RchHJ9CEMQ4oA69r8XNQRzCND9YACjxDAvCmQadZcBNYMH9SUxYq4XDoU3DbA6hmYPQARqI+QXA-oAQb4fdXQ4dnBDAnD1NLV9QXZEY3YYijB4s8hvhLxXoPpjcXotpJ8UULJHRvBZsQj5sT01MyUJY9QpZQ45YDCVZotZgNl00PM9Zips1VD4kQR8gBRdBbBzxQQMlWivs9k51OiFQTUN4t4WA3C1gaJSEqIKFmYACoRGQuQSgAxgR7Ncj1iV4+UtinFZDDDBiqRNsb5QYWpz5UijxNAuQrcdZARb9StVjDU8jNiUE+kBl6BEFiA4A3DpcCgYRNB5jLx5hqEHIBQNhR10U2g18hMSNbj2ljkgcJkXiEAW81ATDgQtCkRaCQQAYtoGY-i-QmSbiIjl4iSilTkLVuTxFJFJFdjWgChJdipuNeZKIlg1BQDNk8gAQ9A2TWkFROTOkI1eSJEpEYwniBiKtySL9hTuQaTxT4krcIkGYTBAQlA2sFTDlrEuSTkHELk4Y3DAiIkz5HBTxHAlgJS4QNB6ZbAWDyhyhrT8lbSVS6VeTekIAZE3DQw1Bx1vAEjCgyIB0k4LTdB9gWg1hgyOSjk7SSkIzHTISqlBlLNtTesEUlg98LY-Q+RaQVAajdZACtAuRedypb5C5lj5dZ1QTCTcywyhUCzLk4hqgyz4VchnAHBfUAwShFkod4lx9KSUlqRmQ9o9C8TVNcl2SQ0+UGUaVSY68tovgFVkllU8hFiT9dtyoVDc5eZjBszty14w09yI1X9boDzdY7A6FGEAwtAPBod5gbCTCYclhnx7yNjQ1dzzVVAW4yADy9iChlgXAQLGpLw-pTxaEEl5ii8g8wK7jHzIKoVdymVQIDzCg7BGzWgQQjhWoeQ-ojhoRqIg9dZdZ6Eli79Qj2jNzFS8KkECKI1dQo0cxbV7VHVE0v04V9wkdr4i8x0URuZVg7I5o75HlpjnlcKxMtM4TnidTAQjyLSWRPDChQRKIQCHBGoRCziWT1KL15NV1XzCQDzPTAYuRrwjZXRvgGzUT4tGoaYig-h3J1ywi1ityNNkMH1V110wqd0n0X0DyTA7B9LTxDKtZdFip6o6D3TER0zoNOz19hNbiNLwqb10MyttLyyntVkaZd8fy8h1BRs3ohD4RTxZklAOz2K2jvtwjuLCrKNEMdNpNZNbKtLRzJLjA+du19gtpLxj9llSjxCPA3AQx9gAUtTSSdT85aF3RUSEQPk-dqheR6paQgwR1lhao8t-AgA */
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
