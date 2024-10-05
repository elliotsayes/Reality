import { ProfileRegistryClient } from "@/features/profile/contract/profileRegistryClient";
import {
  RealityClient,
  RealityClientForProcess,
} from "@/features/reality/contract/realityClient";
import { setup, assign, assertEvent, fromPromise } from "xstate";
import { Preloader } from "../lib/phaser/scenes/Preloader";
import { MainMenu } from "../lib/phaser/scenes/MainMenu";
import { WorldScene } from "../lib/phaser/scenes/WorldScene";
import { listenScene, listenSceneEvent } from "../lib/EventBus";
import {
  createSpriteAnimsPhaser,
  loadRealityPhaser,
  loadSpritePhaser,
} from "../lib/load/reality";
import { AoContractClientForProcess } from "@/features/ao/lib/aoContractClient";
import {
  ChatClient,
  ChatClientForProcess,
} from "@/features/chat/contract/chatClient";
import { ChatMessageHistory } from "@/features/chat/contract/model";
import { WorldState } from "../lib/load/model";
import { ProfileInfo } from "@/features/profile/contract/model";
import { TrackingClient } from "@/features/tracking/contract/trackingClient";
import { LoginResult } from "@/features/tracking/contract/model";
import { WarpTarget } from "../lib/model";

export const renderMachine = setup({
  types: {
    input: {} as {
      playerAddress: string;
      playerProfile?: ProfileInfo;
      initialWorldId?: string;
      clients: {
        aoContractClientForProcess: AoContractClientForProcess;
        profileRegistryClient: ProfileRegistryClient;
        realityClientForProcess: RealityClientForProcess;
        chatClientForProcess: ChatClientForProcess;
        trackingClient: TrackingClient;
      };
      setWorldIdUrl: (worldId: string) => void;
      onUnauthorised?: () => void;
    },
    context: {} as {
      playerAddress: string;
      playerProfile?: ProfileInfo;

      initialWorldId?: string;
      clients: {
        aoContractClientForProcess: AoContractClientForProcess;
        profileRegistryClient: ProfileRegistryClient;
        realityClientForProcess: RealityClientForProcess;
        chatClientForProcess: ChatClientForProcess;
        trackingClient: TrackingClient;
      };
      setWorldIdUrl: (worldId: string) => void;
      onUnauthorised?: () => void;

      cleanupGameEventListeners?: () => void;

      currentScene?: Phaser.Scene;
      typedScenes: {
        preloader?: Preloader;
        mainMenu?: MainMenu;
        realityScene?: WorldScene;
      };
      loginResult?: LoginResult;

      warpTarget?: WarpTarget;
      initialWorldState?: WorldState;

      currentWorldId?: string;
      lastEntityUpdate?: Date;

      nextPosition?: Array<number>;
      processingPosition?: Array<number>;

      initialChatMessageOffset?: number;
      currentChatMessageOffset?: number;
      chatMessages: ChatMessageHistory;
    },
    events: {} as
      | { type: "Scene Ready"; scene: Phaser.Scene }
      | { type: "Warp Immediate"; warpTarget: WarpTarget }
      | { type: "Login"; warpTarget: WarpTarget }
      // | { type: 'Warp Overlap Start', worldId: string }
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
    assignWorldScene: assign(({ event }) => {
      assertEvent(event, "Scene Ready");
      return {
        currentScene: event.scene,
        typedScenes: { realityScene: event.scene as WorldScene },
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
    startWorldScene: (
      { context },
      params: {
        warpTarget: WarpTarget;
        reality: WorldState;
      },
    ) => {
      const { warpTarget, reality } = params;
      context.currentScene?.scene.start("WorldScene", {
        playerAddress: context.playerAddress,
        playerProfileInfo: context.playerProfile,
        warpTarget,
        reality,
        aoContractClientForProcess: context.clients.aoContractClientForProcess,
      });
    },
    warpWorldScene: (
      { context },
      params: {
        warpTarget: WarpTarget;
        reality: WorldState;
      },
    ) => {
      const { warpTarget, reality } = params;
      context.typedScenes.realityScene!.warpToWorld(
        context.playerAddress,
        context.playerProfile,
        warpTarget,
        reality,
        context.clients.aoContractClientForProcess,
      );
    },
    assignTargetRealityId: assign(({ event }) => {
      assertEvent(event, "Warp Immediate");
      return { warpTarget: event.warpTarget };
    }),
    assignInitialWorldState: assign(
      (
        _,
        params: {
          reality: WorldState;
        },
      ) => {
        return { initialWorldState: params.reality };
      },
    ),
    assignTargetRealityIdFromInitialRealityId: assign(({ context }) => ({
      warpTarget: {
        worldId: context.initialWorldId!,
      },
    })),
    assignCurrentWorldIdFromWarpTarget: assign(({ context }) => ({
      currentWorldId: context.warpTarget?.worldId,
    })),
    clearCurrentWorldId: assign(() => ({
      currentWorldId: undefined,
    })),
    updateUrl: ({ context }) => {
      context.setWorldIdUrl(context.currentWorldId!);
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
    updateWorldSceneEntities: (
      { context, event },
      params: {
        entities: Awaited<ReturnType<RealityClient["readEntitiesDynamic"]>>;
        profiles: Awaited<ReturnType<ProfileRegistryClient["readProfiles"]>>;
      },
    ) => {
      console.log("updateWorldSceneEntities", event);
      const { entities, profiles } = params;
      context.typedScenes.realityScene!.mergeEntities(entities, profiles);
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
      (_, params: { messages: ChatMessageHistory }) => {
        const { messages } = params;
        if (messages.length === 0) return {};
        return {
          currentChatMessageOffset: messages[0].Id,
        };
      },
    ),
    notifyRendererOfNewMessages: (
      { context },
      params: { messages: ChatMessageHistory },
    ) => {
      const { messages } = params;
      const filteredMessages = messages.filter(
        (message) =>
          typeof message.Recipient !== "string" ||
          message.Recipient === context.playerAddress,
      );
      context.typedScenes.realityScene!.showEntityChatMessages(
        filteredMessages,
      );
    },
    appendChatMessages: assign(
      ({ context }, params: { messages: ChatMessageHistory }) => {
        const { messages } = params;
        const filteredMessages = messages.filter(
          (message) =>
            typeof message.Recipient !== "string" ||
            message.Recipient === context.playerAddress,
        );
        return { chatMessages: context.chatMessages.concat(filteredMessages) };
      },
    ),
    clearChat: assign(() => ({
      chatMessages: [],
      initialChatMessageOffset: undefined,
      currentChatMessageOffset: undefined,
    })),
    hideEntity: ({ context }) => {
      if (context.currentWorldId === undefined) return;
      console.log("hideEntity", context.currentWorldId);
      // Don't need to await this
      context.clients
        .realityClientForProcess(context.currentWorldId!)
        .hideEntity();
    },
  },
  guards: {
    hasIntialRealityId: ({ context }) => {
      console.log("hasIntialRealityId", context.initialWorldId);
      return context.initialWorldId !== undefined;
    },
    sceneKeyIsPreloader: ({ event }) => {
      assertEvent(event, "Scene Ready");
      return event.scene.scene.key === "Preloader";
    },
    sceneKeyIsMainMenu: ({ event }) => {
      assertEvent(event, "Scene Ready");
      return event.scene.scene.key === "MainMenu";
    },
    sceneKeyIsWorldScene: ({ event }) => {
      assertEvent(event, "Scene Ready");
      return event.scene.scene.key === "WorldScene";
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
    loadReality: fromPromise(
      async ({
        input,
      }: {
        input: {
          currentScene: Phaser.Scene;
          realityClient: RealityClient;
          profileRegistryClient: ProfileRegistryClient;
          phaserLoader: Phaser.Loader.LoaderPlugin;
          profileInfo?: ProfileInfo;
        };
      }) => {
        console.log("loadReality");
        const reality = await loadRealityPhaser(
          input.realityClient,
          input.profileRegistryClient,
          input.phaserLoader,
        );

        const customSprites = Object.values(reality.entities)
          .filter((e) => e.Metadata?.SpriteTxId !== undefined)
          .map((e) => ({
            image: e.Metadata!.SpriteTxId!,
            atlas: e.Metadata!.SpriteAtlasTxId,
          }));

        const playerSpriteTxId =
          reality.parameters["2D-Tile-0"]?.PlayerSpriteTxId;
        if (playerSpriteTxId) {
          customSprites.push({
            image: playerSpriteTxId,
            atlas: reality.parameters["2D-Tile-0"]?.PlayerSpriteAtlasTxId,
          });
        }

        for (const sprite of customSprites) {
          const { atlas } = await loadSpritePhaser(
            input.currentScene.load,
            sprite,
          );
          createSpriteAnimsPhaser(
            input.currentScene.textures,
            input.currentScene.anims,
            `sprite_${sprite.image}`,
            atlas ?? input.currentScene.cache.json.get("default_atlas"),
          );
        }

        return {
          worldId: input.realityClient.worldId,
          reality: reality,
        };
      },
    ),
    updateEntities: fromPromise(
      async ({
        input,
      }: {
        input: {
          currentScene: Phaser.Scene;
          realityClient: RealityClient;
          profileRegistryClient: ProfileRegistryClient;
          lastEntityUpdate?: Date;
        };
      }) => {
        const beforeTimestamp = new Date();
        const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
        const entities = await input.realityClient.readEntitiesDynamic(
          input.lastEntityUpdate ?? tenSecondsAgo,
        );
        console.log("updateEntities", entities);

        const customSprites = Object.values(entities)
          .filter((e) => e.Metadata?.SpriteTxId !== undefined)
          .map((e) => ({
            image: e.Metadata!.SpriteTxId!,
            atlas: e.Metadata!.SpriteAtlasTxId,
          }));

        for (const sprite of customSprites) {
          const { atlas } = await loadSpritePhaser(
            input.currentScene.load,
            sprite,
          );
          createSpriteAnimsPhaser(
            input.currentScene.textures,
            input.currentScene.anims,
            `sprite_${sprite.image}`,
            atlas ?? input.currentScene.cache.json.get("default_atlas"),
          );
        }

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
          realityClient: RealityClient;
          position: Array<number>;
        };
      }) => {
        console.log("updatePosition", input.position);
        return await input.realityClient.updateEntityPosition(input.position);
      },
    ),
    registerEntity: fromPromise(
      async ({
        input,
      }: {
        input: {
          realityClient: RealityClient;
          profileInfo?: ProfileInfo;
        };
      }) => {
        const realityParams = await input.realityClient.readParameters();
        const msgId = await input.realityClient.createEntity({
          Type: "Avatar",
          Position: realityParams["2D-Tile-0"]?.Spawn || [0, 0],
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
  /** @xstate-layout N4IgpgJg5mDOIC5QCcwDsJmQWQIYGMALASzTAGIBlfdMAAgCUxcIBPAbQAYBdRUABwD2sYgBdigtHxAAPRAFoAjABYAzADoA7Ms7KAbJwCcygEybDm1QBoQrRHoAcW5QFZDJzi86KvJw4oBfAJtUDCw8IlIKalpGZjZ2RV4kECERcUlpOQRFRRMXdUMHIxVNBxM9TRdlGzsEPQ0jNxcHF0tORz8gkPRMHAISMioaMjiWDhNkgWExCSkU7JM1Apb3C0U9SrbNWvtOdXyTVSNN1TPDVRdukFC+iMHokfomcfZVKdSZjPnQbNdNEzqXKqI5+Ey5Sq7erKA4bdotHxnM7XW7hAZRdQASTQs1wABtyFwPmlZpkFohFJd1McAXplHlDC5HDtbIhVA5lIZ1MpOWdOKo9IoihcUb00ZEyFi0HQAOK4AC2YCldDwpBV6AArlLcQSAOq4ZD8OiY+WKiDEXCiMBE6Qk75ZCmUmE+C6qTSbPIuXJQhpcy6cJacBwORyKByGUVhfoSpXY2UK2PS1VJzXqSiEQQAd1IUDoABlBFA1UxYBq8aJ1AWWGM8WJWOQIJIlaQAG6CADWStR0YeyrliuVyfVaC16azOfzheLcDLFarEBrdYQrcE+EtcyJNpSdrmDpyAo0PI6hncim8KkMULP7iB7sUmk4liZIKuwRuYp7GLj-cTKtwauwVMx2zNBcwLItpRLWd1BeWtRFYMY2HIfVDWNU1IAtK0t2mdJd3JHIHEpIFHHcMoSOMK9wQ0d1ig2VxCI8ZRIzudFJW-BNB3-FMRzTDMQLAqdIJncsYOYOCEJeJDsM+XCyV+ClyicZRNA2EMAw8DkWTqXINiBFwKgsNo1HdPRmPFXt2IHOMh0AniABVkAIdsJ3A0gGybdQV07dRu3uL9pR-TiANTBynJcwTlzQNs12+TceFtL48PknI-EULRmSDThvA5AUoWKRp71DFQ6U8Uy3181jf0C6yuOHLVQvwZzQMnCD3MlLyuw-Py2ICjiauC+zHMa8KIMi6L10kTckgS2SflkClKicDpVB0Tk9GqFSalZBBygKbQTDMZZKkpQJyq6yq+z66UAAVUDxQQWCwbVxHxQl4u3RK5PmhB5EZdQGj5YxVEpSpgZ9IpClyDwjB5PRGVUMzPx6+MrJuu6Hr6Z6LQJRJiU+ubsl+goAeOIGQcsRQfSDIF6ThqoTAcFb+UR7qqquuhbrAe7HuQSsMcXeC2ubKKO06qNWcu1GOfRnm+erWClxXGKNx4aSdy+v5dLaN0OmqQyVq0+wIZdQMOTcAUTBZi7LN-BX4LoGJJRQ-gcyx17nbQs1MOtd6cNJAnEHyG8gwcSwVJWzk2ivd0YQDRkH3vbRNG0K2Y0l22xLrB2nnUZ3XfnAX60bdqRe8iq05t5U7YQx2lTz0C5YXauxtXCa0DivHZr3PxjEKU4fAZjk9COaP1vUFxjg8AU1AZpZU4s3qper7PaHUABRNBxHtgARLM0G5iAsQgPEKBkWBREtJVcAAMytZAAAp8iygBKchy4XlGM-xLPa-Xzes93pmfeGMj4nzVvjPcqhDDU3WvDDY-hDCCivF4PQBw3Q+EZtsJ889-Kfyrpne2v8N5bwQoA4BLB1AAFV+AQEvnQYhsw4BC08qXMWLEK6Ly-uJFekoGE7z3gfKhNC6F8OIHAFuytJqq19jJf2kCQwFEIsDVwZ4dYbCvJcGEdNgwWHZCeJkODkbVSEt-QhOdrp4lwKwLAHN8bqGuvjOgABFDUYBXGgIoNQ2hVpbGzXAV3fC+RjjqCymcZYOgDATyhP4VBboXBeFMCoPI7JDFsyXgQmu5jLHWOQL4-29jHHUMEZiY+FAmBFnPo5b4dAADCkhr7EGQGafxcj8IrSgYUfQCTjB0i2FeIMWj1q6H0Po0oqT074NMZk1eFirE2IcbNAps06BFJAV4uhCz-bMI6j5c6HC8FxmXr-WZOS8nfCWf7FZ-BBHrJ8Zs74Ei24dxmq05KxxQ6Qy9CGCwVRtD9N0IUL0OhGRMgDOUcZldDkZJ4UqE58y7H3LmFcwRkl6wtPtG0tQXIendP0PoKoeU6QhM2A0Skyd9IOAhZwyZ3DjnZPhYsxFkhkUgLqYIPEjYgHkDPhfK06gb533vmeF+b89kf2MYXGF9j6W5KZWgC51TVkULZRyve6KkrfXadirpugen4pcP0sw-07wHSKG0e8CMzri2ttSqFUypV8IkmACpogqlzDdjjGR6sA4IHyFULQIIlH01cJebaKhTD-SSeGS47hBRMStew8V7Mjk50dXEF1brJCiRdVgHM2zWG7OtfsiVKbV5pvKcQSpbds2VrvjmR5sVpGd1ed9QeGgTyuAOvE1olMw08kBHGsMFw3AVBUFSg5JjaWpv-vbCtVbzn6lmM1a+ghcn4HqcQeUbduXn0vvy2+WAhVZU4K-d+uCS3QqITOp1Gbq2LvEMu1ddB11oAaVuxtzaMVvL8E4A8AZ1r0kpPpK89IuQ6PNkDIwK1x0Xvtb-GphBLR0EVLAWAuAYCwA9W9T9Grsgxt-alXQDN6RuENgRAUNMYnLXWKYGDybL05wQ0hlDaGMPqBlGAUQyG4CsfoOujUm981tjLmK899G4OMcQ1xlj6G4Dsc49x1Dsnn2CAE6IBtKtuDqo1ogHQKggTBjUMGcMhEmRXnKJof6PJ2TsnMCpMqPQi1JvSRJ1eTHpM8dk5hjjHmlMwBU2p8gWBkCrvUNcy0K6mmFsTWJlzU63NScU7x7zCmZP+f45vDTUitNeogfhHQRq6RQKZCeEMJho7VGpBYSo-hwyhMpQm8ysWuE-0k8xzzbGSknx3byq+B6H5PxPaKpzzWaWtYS+1vzcmus+xwzphA9IGbjyKJYZScMTx6CvCefYyhyhQM7VUCwDXHMxaMeJ+Lkp3NJa8+oBDYBGp0DIJma7GGhOi2i01s7cXxuXcS2luTd2HtPZe+IpWTym0vK-d9HQ5hqTVGUkHM8UTtoeDcOocoug4aChBHEoIb40CCEwPAFIZ6yCQ9wwoBJfc3QHUIotJ0UJfpgcQSDCwfg9HHffCNnqOpyfzdMFCdku2gQbDpOCQDcNXwnc+2ksAfOfXyFcKgxBNOGZwiUVtOo7JUEktMF6MwZh7x0aljZTU8u9wnkBK0DwT5gadE14gKnWxijxOMGeYexvfym54tiXnH0AnJTPDodH+lHyXDt+UB39Rh4HFMByXIHQhTuk90Fbio4+IjWnKWcs5v8I6VQQzB8rRCImeqNEpkITvAdA0j4FSmgU-9TT7xcczVXJCWz3Ofm1dc+B7ogcUOQYESl6j9efYiJTBFEUvrhvSZaq2XTy3gSEE4gd9Eva1FPfvq15WF4a84IAzAwcFeYE49HCPjaPkPIM+-wDXqkNJqS-SCb+yJSN06PGaT1MDoYM5XtoNCcIpGeA+H4KHvGtLkjLLqnnVFQmgLgBqKIBmMgJWpAM-oHFlJZpYCzveLoACO6HlFlNyMYD-m7ojtft7qOBfMgFxqWmTv7i2osJ4FyACO7kGL0gCP0tAnpGcACBPLoCGNfgAPIIE2K1yoELbDyNAkZnAGDhqtBQj6QFDuCRzDLV5HDX6cwHxYBiHyBHDK46DaygoXCbbbTKTtrRp+C4EdDn7qEyyYy+4vR4jaFhhODGCeBPgGBGE+hUhCiwIhgMhko2FcwYxPSUCUFcbkFiHgiWamBZQXAYISGII+hLZlB0RLBCgdDhiBGaG8yhEGjUEMa0BiHDxOCODAwbB6wD5R5Y5AjTymAlRlAWBZHBG8wFzd50FQ6LD3jcjQxxEtAJHGF1DVEgz9r1Hhj16NYQETIzbaHf7U4Ahq704rTyEdBaDDGD5kT6DX40Fy7tEU6+ra6V5hKaJWHI51DKSWYMzeATwVBuCMhgFc6naQF2oXZ1wGguygSRGuD7ApGmFZScgVBkZwioJhj6DFEAZxpbEFFOxvGuz2HYyfEQw-HtC6oAnRwhiFAHSqTpH6JS4PEy5TGTo-avGGj5xd4ZKRHmCKJ5AJxjFnAMyjwaBeDaCeBGYgyQmubQkkkNwezbFiHAwAhWZqRgrxIgxonK6YmsEgjJyeDskvF-wkJ0BkIHx8kAhcg+B66CjFDrAGphoAnUjaBGH+FskTESyQqElmJlrXqKkCIgLTG7HzZujJx6QalhhGAqQ6naT7aFBlDJzoLtIAiylEnykAI2kUK3L0CiJwBiHAqWYchqD-Ezz8gaKETo4kSH4pFHaBkWmShwqyp5Z+wdGBzxmHHtLVAnHWB-7hjdGPhVB1Gjqc6k5PHmnTI5kypnLupyrOKuKuKfHlAlnhLllQhlCAgHTAzTx5BxmWrgGmm2rNlSq5ntlZqdkuJuKxilKREIghKXBHANGi4j7eA65eCkx4rcERgmk2oTqSp0pzJ5mMqFLXIYyRGERpQgl3gjIHlR7JyoLaACjJzugxwOZ4mTFmlXlZI3mLnyqdlKqHx2kFl7FnAV6F6CgGA7nsj9Icjo58gI6IIKJTlAUzmXnbHSrgVyoKpIrQVCLeL0BypPlo6vlxpwwfl5TaDGpxn57gh0hZktmwptmkVQUPkUIb72k+oCitDjwMhujuA-ociGoAHxmXAhjDnJ7nnFrnZBkLl8X3mCIqqcpzTeqQLAyAirAPiDqi4ekUj-rUhqCH7xy6F4WNkEmgWWkKlzquptyfErTdHxJrS07QK-7aQMzUThpmBGGbBlBcUOpWmuWZrypwn4i9mAh656zDwMx+Ugb0j94+AGBY5hWWwqXOYtbZlKjlrOq1oxXqC7y0FwUOkTyoL6BCgRzJzQKAk8hpRq6go5WVB5XTkXmwZyklW3rnKuW5ofHCXdyVBj46D+g9oegj70ixlhXxySUjIRVXouWlXzrur3oTiRYqavqbruVjVtLn5AhmBjnhxgnpVtV04eD5C7ZxGrVta+bJZ8n-AhLggchXEhq9raTDz7BLBeh0j0jHBZSAUOUgVEVXb-aYZxWOFHVvJeAFABgglfVuA-UKSeV06XAejJIgiPUTbPU3Y+Yg4BabwqldF5D6DV5rSuDma5DcjeA0R5Cv4Bj42-aTbJYeLRluioJMimDsgVBQIDEUgnhMH6RlCg3KT+C4ng2zlOXs2E1saA7tiPZgDPbQ18nVFIgNBBwnhnBQiMRpSJJejNCUkMxs1KhQ0dZyYAByggtSUm3NHgAaZgCcdRR+YaVQS0pMTIoc+kDQEK658NW+vyy2dWx6P+FZWuHITgEI60Xt4I-geOAQQAA */
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
                  actions: "assignTargetRealityId",
                },
              },
            },

            "Showing Login Result": {
              initial: "Load Reality",

              states: {
                "Load Reality": {
                  invoke: {
                    src: "loadReality",
                    input: ({ context }) => ({
                      currentScene: context.currentScene!,
                      realityClient: context.clients.realityClientForProcess(
                        context.warpTarget!.worldId,
                      ),
                      profileRegistryClient:
                        context.clients.profileRegistryClient,
                      phaserLoader: context.currentScene!.load,
                      profileInfo: context.playerProfile,
                    }),

                    onDone: {
                      target: "Reality Ready",
                      actions: {
                        type: "assignInitialWorldState",
                        params: ({ event }) => ({
                          reality: event.output.reality,
                        }),
                      },
                    },
                  },
                },

                "Reality Ready": {
                  on: {
                    "Warp Immediate": {
                      target:
                        "#renderMachine.In Game.In Main Menu.Start Reality Scene",
                      actions: "assignTargetRealityId",
                    },
                  },

                  always: {
                    target:
                      "#renderMachine.In Game.In Main Menu.Start Reality Scene",
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

            "Start Reality Scene": {
              entry: {
                type: "startWorldScene",
                params: ({ context }) => ({
                  warpTarget: context.warpTarget!,
                  reality: context.initialWorldState!,
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
                  target: "Load Reality",
                  reenter: true,
                  guard: "hasIntialRealityId",
                  actions: "assignTargetRealityIdFromInitialRealityId",
                },
                {
                  target: "Start Main Menu",
                  reenter: true,
                  actions: "startMainMenu",
                },
              ],
            },

            "Start Main Menu": {},
            "Start Reality Scene": {
              entry: {
                type: "startWorldScene",
                params: ({ context }) => ({
                  warpTarget: context.warpTarget!,
                  reality: context.initialWorldState!,
                }),
              },
            },
            "Load Reality": {
              invoke: {
                input: ({ context }) => ({
                  currentScene: context.currentScene!,
                  realityClient: context.clients.realityClientForProcess(
                    context.warpTarget!.worldId,
                  ),
                  profileRegistryClient: context.clients.profileRegistryClient,
                  phaserLoader: context.currentScene!.load,
                }),

                src: "loadReality",
                onDone: {
                  target: "Start Reality Scene",
                  actions: {
                    type: "assignInitialWorldState",
                    params: ({ event }) => ({
                      reality: event.output.reality,
                    }),
                  },
                },
              },
            },
          },

          initial: "Initial",
        },

        Idle: {},

        "In Reality Scene": {
          exit: ["clearCurrentWorldId", "clearScenes"],
          entry: ["assignCurrentWorldIdFromWarpTarget", "updateUrl"],

          states: {
            Warping: {
              states: {
                Initial: {
                  on: {
                    "Warp Immediate": {
                      target: "Load Reality",
                      actions: "assignTargetRealityId",
                    },
                  },
                },

                "Load Reality": {
                  invoke: {
                    src: "loadReality",
                    input: ({ context }) => ({
                      currentScene: context.currentScene!,
                      realityClient: context.clients.realityClientForProcess(
                        context.warpTarget!.worldId,
                      ),
                      profileRegistryClient:
                        context.clients.profileRegistryClient,
                      phaserLoader: context.currentScene!.load,
                      profileInfo: context.playerProfile,
                    }),
                    onDone: {
                      target: "Warp Reality Scene",
                      actions: {
                        type: "warpWorldScene",
                        params: ({ context, event }) => ({
                          warpTarget: context.warpTarget!,
                          ...event.output,
                        }),
                      },
                    },
                  },
                },
                "Warp Reality Scene": {},
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
                      currentScene: context.currentScene!,
                      realityClient: context.clients.realityClientForProcess(
                        context.currentWorldId!,
                      ),
                      profileRegistryClient:
                        context.clients.profileRegistryClient,
                      lastEntityUpdate: context.lastEntityUpdate,
                    }),
                    onDone: {
                      target: "Idle",
                      actions: [
                        {
                          type: "updateWorldSceneEntities",
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
                          realityClient:
                            context.clients.realityClientForProcess(
                              context.currentWorldId!,
                            ),
                          position: context.processingPosition!,
                        }),
                        onDone: {
                          target: "Cooldown",
                          actions: "clearProcesssingPosition",
                          reenter: true,
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

                    Cooldown: {
                      after: {
                        "1000": "Ready",
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
                      realityClient: context.clients.realityClientForProcess(
                        context.currentWorldId!,
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
                        context.currentWorldId!,
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
                        context.currentWorldId!,
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
        target: ".In Game.In Reality Scene",
        guard: "sceneKeyIsWorldScene",
        actions: "assignWorldScene",
      },
      ".In Game.In Other Scene",
    ],
  },

  entry: "activateGameEventListener",
  exit: "cleanupGameEventListeners",
});
