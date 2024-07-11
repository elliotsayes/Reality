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
    hideEntity: ({ context }) => {
      if (context.currentVerseId === undefined) return;
      console.log("hideEntity", context.currentVerseId);
      // Don't need to await this
      context.clients
        .verseClientForProcess(context.currentVerseId!)
        .hideEntity();
    },
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
  /** @xstate-layout N4IgpgJg5mDOIC5QCcwDsJmQWQIYGMALASzTAGIBlfdMAAgCUxcIBPAbQAYBdRUABwD2sYgBdigtHxAAPRAFYAnAEYAdAA51igEy752gMyL5WgDQhWiALTL1qgGzqDB+-ZcAWAOxL7n9QF9-c1QMLDwiUgpqWkZmNnZlXiQQIRFxSWk5BGVtRU9VThU85WNteUd3c0sEGztHZ1cPb0V7HUDg9EwcAhIyKhoyWJYObSSBYTEJKWSs3QN85WV7eU53Q04lRSrrWwcnFzd7Lx8j9pAQrvDeqIH6JmH2AzGUifTp0Cz3Tl9VA3d5AwrTycTzabzbGqKVTaXz2ZTfdzLYGKJxnC5hHqRVQASTQk1wABtyFxnqlJhkZogwVD5O5NJ4DOptIUUcYIWD8vYwZwjOpVvIGQY0Z0MREyDi0HQAOK4AC2YAldDwpCV6AArhL8USAOq4ZD8OjY2XyiDEXCiMAk6Rkt6ZRDKAzw1RKdyLQzaJmOrYWBTqNSKP5+XSeRReb7C0LdMUK3HSuUxyXKxPq1SUQiCADupCgdAAMoIoCqmLA1QTRKp8yw6AA1LCwCgQSQK0gAN0EAGsFeio9dFTL5Yqk6q0Bq05ns3mC0W4KXy5WIDW62AEK3BPhzVMSVbkjapnbsn97AU-ooVGV5MpPO5vdVFipoUYweUviswRHLpjxbH+wmlbgVdgKZjlmaA5vmhaSsWs6qLWyD1kMbDkLq+qGsakBmha27jGke6UtkrhHoyrquE4rTAgYEIOvI8jOp4QaFNRoYMu+oq9t+8aDv+yYjqm6YgWBU6QTOZYwUuCGsMSPDWq8uEfPadJqLY3wbH8iLfNolHzDR7jXpo+iBvC9gsT2WLsQOsZDoBPEACrIAQ7YTuBpDkI24qrp2qjdlcpmSj+nEASmtn2Y5gkrmgbbrm8W5STuMkUnJ2Qwvk6jXs+fghr4EJ+jRKJOHybjuM4izGd5X6+RxFlccOGpBfgDmgZOEEuU2qjuV2IomWVcbmYmVVWTVdl1SFEFhRFG6SFuiTSTh8WyPa9icJwvwEYo3wuqsN6IOo5SqMYXwEdRgLqJ4JWfr+fmxgACqgBKCCwWCauIhKSaScXvHNCC0nUywOjkGzUhRPoIEcS0GCC8ycLkuhfIop3Rn2FWStdYC3fdyCPWaRIJK9M3vVk6hchoayOBejLHUcEJHO4DiOjCXK+GC15w2x5U9XQyOo10FZ3QusH1s1bnhR27WRqV52I+zN08w986LnBy6rpFm48FhLy4-uC1qNR2h0vo2g5HSgPVMddgAvMLQCqeizuMzPndb+fP0NE4rIfw2YY89ruoSaGGWjF2HknjVIOnYeQeo6ygAmsm0IJ4SwPi4ngM0nzLKLbXUXZKjt0M7Cqu+7suOwLzZCx5XlnQjbPZ7nqj56B3NVo7o1ruNaDRTjgf7vr17OmsILbfSjQQkxvzlM4QYejrQpBOcHVi5XDtiTXACiaDiKIrB0AAIpmaCcziEAEhQMiwKI5oKrgABmFrIAAFGUi0AJTkOX8NmYv8s57cqir+vm87xmPePMD5H1VruWasw45qGJpwY614uSAghKCfIxhgRKCMH4Qo2h07iyrkvb+v8xD-13vvAAqvwCA586CEPEHAYurVS4iw-G-VmH94IrzXkQ7eJDgHkMoRaahnDaGwGbkrCaKt-Zq07nhHWDJfi5Son4JkygkEhlUIVWB8I-QgiTjbGer8Wb20VNXb+l0CS4FYFgdmb1VCXTenQAAimqMAziQEUD4VQuxuMwFvS7vobSRwwaOiUCYewmkBQaHIiYOYLQlg4IXsY-BtBbHmMscgaxuNbH2PIfvbEh8KBMELKfOybw6AAGFJCX2IMgE0Pj1YyOOqDDY5MtAtD9GEoGDoda-EKnCLkz5IZ6I6KLCu79EmfxrmYixVivGByybjOgOTeEUM8W9ehbVPJz1Gaw8Z7DTGpJmTY2ZpSlksFUB4gRxypiiNbu3aa0iEoejkYyZkJhYFcm2p4Si5QjyulWsoLwSwQwmHiWM2MJjklTLSRkuZVzJCLP4Pve4iE6kPI+sEuwsCLbUQBXSDpt41h1G0V8RkiwXmgp2eCpJ4oaGb0KcQYprcPZY0keAoOCBHROHUaCUMeRvAOnxYgOE+RODwn0PUEEhRp7DOYYYzOcs9nJNpbEIpogSlTFUPS0+WBszrMYZskZLCjFUomQQoRdKwCqvVZITVlqGU32zDcqKEiO62jwhHNQXIGTHQFPUL5QMlG7X1l6ZwawXDYP0Vso18qIU0vNSq+11q0C13-OIBql9BDpPwJU4gspW7kBPmfC0qgr431vvCJ+L8o1yolrGhUyqtVqqZbqSY6bM10GzWgKpebnWutkuiowOVYGhL5FeP0WVunMkHUExkUcKXGqztShUZTCDmjoPKWAsBcAwFgMyl69y3UJRcFy0J8J4EwgvJRXQUIk46ADAGRkOgjKRsNTWvBprkkrrXRurdO7VBSjAKIddcBf30GzWqNeeq2xl2rXbGNS7VBfqAz+7dcB-2AeA5u1DHbBAQdEE65W3BUWHvRQtbQ0JI5kT+JPRElE+7OmooMhaRg04vtlXB2tCGkOYdA7ugDyGQPYfA5BrAyBM2qEReaDNNSDXsYzpxj94puMob-fxnjQncNrwI+IojrLfHuoDNTUopMeQlFo5082zpCiFAHueYqbHWIcffYqpTq6BNYb-Xko+BbT7nxLdfLA98VicGfgYpzbCnbf2U4Jzz+TiP9qyIyYEqg7yAjKP0h0lEjh1EKvMMoiwLzbXnfBxTy63Pqb-SusAdU6BkAzBVuhrkS7QaYY5+TznIufvKyptDVWat1YayIxWtyXUHoS4gIwPwUq+DyEoRmywssLV2gyZkWKBUpUCDPNAghMDwGSGFsgY2IFUlyM6U8i0ARMSKBCGwfgNCcpBJHRpAZ5AUq1Ed9lHIzurRUldko3yjx5AWjyQqfJzsnQc51XBYAPv7n+OR1wpM-r6BDEbeaNEDCGBNloeYwOI0yra9D-y3E1Sw7wjkEoRNjBHHSi0f11QXBQkhpoEE+sBSGBcMViWlkUy4ne7FepCUBVLWieG6kJh-gQhWAYFLfpI5fEWmDPIXO2Y854sBYa04SxljJ0L3ImKTxnhxVeGOOhPUaL5FoVYg6Ve-jV6OPimuhLa7nDzBVMOBdoqyFRGXbSweGD8JeQV2QNg0WBWsJO3hIYgsh-PMFvUArq8dw1JyzvoLZ2RdUAOJHvd9KJtExYgpgT0-tN3X4VEp5pZaNK2er7wvE+qqoWq9UBIQV1x9B03xoQMi+GG0iOskGitUN4JkhRWjfEBK92P2yF1-kTxqUhaBcBqlEOmZADLIDt9zxEhmj4USulnUg-4BQunLABMC+YtuG-9VTGfZAQG61b-khEzQMNMeEvdHRuRnpYSwM0Heq-WMAAeVXysVzifwQB0m2nURpxRxCUQSBjBiPDKB0kYhDHl1hmn2jQlg5mlmQAgOCwcB+lpn+lRwhGjnUXmDMzhFpC5FDEAKRiljRmZQgJBnUX+CvEOi0CZBjjHmdC0Glz5A9FaFYwJyhwSSuiYK5koDvyA3twgM+WhGMD5HHlpCfCQRaGHxKAyhKBPFaAYMlhRjwNvz1AfyXQINDCILonNiWB0GvEokhnI0WABWBAjyOAFAMNwOYMLiXAsKWmBDhFB3UgZBjk4JP3f2aSfUBEAPyQIKdFFWiV0ldB1kjghEdGpkjhcGZ18FBFpCnzELj0pUXVKwgOZDWGW3DgK2oxjjKAR0RD5Bs0MEKmYiwLfQiy-mSTrigFKOswqKcCqOjil1cHUUyOOiTiDwvAMLrRTX1Hdj5yegJFKNsDqH1g9ABGohUOD2WBl29T+EWD9GcEMCmIQy6Ibl5l8M9xz2DiMBSzyG+EvAJmJhLwQCcCWkRBDH30dG8AhwKJnxKxczzj1Ddnri9kf0uPGwQG7icJcCjkWgBVSM6R0Vol0FsHPFBCGVrzkyJxNQBJ-njQASARYFKLWAxwUUBCUX1iGJpDcCyL5D1iMGONKzxL-m4UAVyViPBOO0hJR2H13xMGQUph2k0C5FyDcDJXKEZNxOVQJLIRWQERoWIDgFKKjwKBhE0FRMvHmFURygFA2HvUwTaFaPrxxM63FChUOUFykSuMhLWDUFWG5GyMtgcKvGH0KB0kcB1h0lsElNNIVHNPSThWTUDMcWcWcWJNaAKAj0WmEKdM6SWCcJWGcIFAdBaB9I6LNIOQDKOXsScRcRjA5OzwhPyxFSjMdJDCvU0LBh1hMEnxRDKDTMmUzJhTeHmUDgRU5lKKZHIzBn5McFPEcCWEonjOPA5xHzKPx0xMJwkOKNxP9ObI1WDNOQgDcVKNDDUEfW8DWLHzyCvR7kn10H2BaDWAbP2WmSzMyUXMRWWX4XoEDIgMdCW1hA9CUlpBUGeMoxly0AQUuxBC8BrwO2xJnN9JSTPPnJtUvKRTiCzytKLIfQcEWilRKE+Ul06S9IKD6WpGZChnyMnPEPj3d3TPrXjUbSTXvInwcDBCS19ScGeMRGpnSkKgDzyIfRPKVWIrtUZRbPmMxnvNsC1kMHhEFGBxUSBm1hS3hBcEZBpNJVYrjRZJIqZR3kO05PZVUjsCeySw2DdDcCQQBRSyKl1KDAFBwoAunIIo4Xko4qbRbMbR1VAl4v1mhGvDjj6V0PkEpju1m1aFaH6P+VkqIssqtWbVTQnGkxwy7VzVbl4vjg2OMADEt2oiyjcHUVDEhhDCwUxx+NwsKNn2mOiw8yVJUv3EBC+FHhWFPFBDB1BAcMZF2k0HSIdGOBMtg3a3aJrnyt4xYKKvdQHJpi5GcvhO+HfM1JS32gWiKD2NEOyr+IU1xI6tQz4wwx6xwzw3vJMDsEnxZEqsKGqos0Wl2nhDVNDBFL9H8sQ26xizQy8w90LK5OPV+QWmC3iryHUAB3IxCPhFPFH3QTOvmsq0IGq3bFqzAHqx6z21utUuMF9wJlsGcDBkvADG+RuPfw8DcBDH2F+ouoKt3QADlBByk3N7zTxyNoYR9toURMdNJKdyhZskLtYisjSvwCyYKuTJ51F3RNSERCVKhECURdpaQgw71lhtpn1AggA */
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
                    "2500": "Update Entities",
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
              exit: "hideEntity",
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

                    onError: "No Chat",
                  },
                },

                Idle: {
                  after: {
                    "2500": "Check new messages",
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

                "No Chat": {},
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
