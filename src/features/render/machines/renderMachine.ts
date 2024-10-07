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
  /** @xstate-layout N4IgpgJg5mDOIC5QCcwDsJmQWQIYGMALASzTAGIBlfdMAAgCUxcIBPAbQAYBdRUABwD2sYgBdigtHxAAPRAFoAjABYAzADoA7Ms7KAbJwCcygEybDm1QBoQrRHoAcW5QFZDJzi86KvJw4oBfAJtUDCw8IlIKalpGZjZ2RV4kECERcUlpOQRFRRMXdUMHIxVNBxM9TRdlGzsEPQ0jNxcHF0tORz8gkPRMHAISMioaMjiWDhNkgWExCSkU7JM1Apb3C0U9SrbNWvtOdXyTVSNN1TPDVRdukFC+iMHokfomcfZVKdSZjPnQbNdNEzqXKqI5+Ey5Sq7erKA4bdotHxnM7XW7hAZRdQASTQs1wABtyFwPmlZpkFohFJd1McAXplHlDC5HDtbIhVA5lIZ1MpOWdOKo9IoihcUb00ZEyFi0HQAOK4AC2YCldDwpBV6AArlLcQSAOq4ZD8OiY+WKiDEXCiMBE6Qk75ZCmUmE+C6qTSbPIuXJQhpcy6cJacBwORyKByGUVhfoSpXY2UK2PS1VJzXqSiEQQAd1IUDoABlBFA1UxYBq8aJ1AWWGM8WJWOQIJIlaQAG6CADWStR0YeyrliuVyfVaC16azOfzheLcDLFarEBrdYQrcE+EtcyJNpSdrmDpyAo0PI6hncim8KkMULP7iB7sUmk4liZIKuwRuYp7GLj-cTKtwauwVMx2zNBcwLItpRLWd1BeWtRFYMY2HIfVDWNU1IAtK0t2mdJd3JHIHEpIFHHcMoSOMK9wQ0d1ig2VxCI8ZRIzudFJW-BNB3-FMRzTDMQLAqdIJncsYOYOCEJeJDsM+XCyV+ClyicZRNA2EMAw8DkWTqXINiBFwKgsNo1HdPRmPFXt2IHOMh0AniABVkAIdsJ3A0gGybdQV07dRu3uL9pR-TiANTBynJcwTlzQNs12+TceFtL48Pk-d9Opc4qgBCFNihcpNG5e96RcIqORcVQzM-NiAo4uMAAVUDxQQWCwbVxHxQl4u3RK5NkBRGXUBo+WMVRKUqYafSKQpcg8IweT0RkyrfXzWN-QLavqxq+hai0CUSYkup+HqEHkPqBuOIaRssRQfSDIF6TmqoTAcVQdAWnooz8yr4ys6U6rABqmuQSsNsXeD3MlLyuw-D6Vuqn71oBoHq1gpcVxijceGkndur+XS2jdDpqkM56tPsCaXUDEqLj0ExyuhvtYZBhCYklFD+BzLa2tZtCzUw60Opw0kDsWNxASDBxLBU57OTaK93RhANGQfe9tE0bRaeW+nvsZuhmaVVn2fnRmwebKKO0h96Ncs39kfgnWnnUfXQMRhcbdYSLovXSQ4r22ShcQPxjEKU4fEejlqesVkcndFZjg8AU1EepZ1ZjTXrbEus7dodQAFE0HEW2ABEszQf6ICxCA8QoGRYFES0lVwAAzK1kAACnyThOAASnIJaU6t5VXczyVc-zhCi8zEuNvLyvMf2vdVEMG69GaYa5qFQUry8PQDjdHwnu2J9k4sqqtcH3Wc7zjPx8nlh1AAVX4CA67oEfZjgY3PNN7ze+Pr60-xDO59X6F2LqXe+j9n7AOIHAd2q5PZoG9glX288QwFEIsNVwZ58YbCvJcGE91gwWHZCeJkR9-J-wHunW258ap4lwKwLAdAar7XUMw32dAACKGowDcOnhQB+T8rRMP2rPZB+F8jHHUB3M4ywdAGFKlCfw283RFV0OCekRwHBkM+qtISADqH21ofQxhbDBasP2nQB+YDMQVwoEwIsNdHLfDoAAYUkA3YgyAzSiMFvPNQXJjDL10IE-QVQrxBnwUE2aJDSjaJhqfKhTNDF0IYcgYRvtzHsKsVPARz9THfA-hDHyUNLYn3-uJIeSojGpPSWY-JcxLH8DAbkoR9TJCwLRl7DG-MZK+PwsccWk0vQhgsBlGokczy6EKF6HQjImQBnKHE1OlD9FJKztUkxLC2nSmybfSS9YfH2n6f4wo+gvCcn0KElwOU6RSM2A0Skqt9JaMWiUvuZSVkVJoSkzZGTtmNLAW4wQeJGwT3INXWuVp1CN2bi3SZXce5vN-ro7W3zjFpO2ZkwWAKp5ApBcXQ5SVDrPQXqcqJIStjhLMP1O8Jg-CtBUpYJZ-c4xn3tsAiSYAHGiCcXMDmO0elYz9ggfIVQtAgnQQ9Vwl4Jk8kBIKek4ZLjuAVcyj5rLEmVIvqPOI3LeWSFEtyrAOZClf3Nixd5FCNWrK1Ry3VxBHHwMNQ65uOYOnwMQZ1MRyVQ4aBPK4OlxUvRXjlf1FQYYLgi1Va8i2lqUVsqzna+xLr9VoAdv+cQoE6AN0EGk-A7jiDyngeCmuddoVNywHCjuCKf7kPjZqoBl9bbJsdd8dNsws05rzQWotsVBVz36fS6kDQAzL3pJSfSIahTqEIW4BeagjDPTVVavRXz7YuMIJaOgipYCwFwDAWA-L2o+z6clZVTgQT+DURyF0JMCIClukojoC8VKmGXfWm158N1bp3Xug96gZRgFENuuAf76D5o1HnU1bZv5IrrQzBNkpv3Ad-fuuAAGgMgd3WhugEG87ur7dwQl2NEA6BUECYMahgzhkIkyK8uV+o8nZOycwKlTIxotcihDDb12bpQ6BtDh7AP8ewzAXDghIOiHIFgZAub1BNMtF2+UxTY1cYSZ+3jP6BP-uE1hsD4nJMEfRkR-t3rDo6GpXSBeTITwhhMLLao1ILCVH8OGaRLy3qcfg+ptdWdkN6cE3wktkL64Vtbu3GtcGdHcY035vjAX-02JnqZ095m8hODcOLYmc0Tx6CvCefYyhyjzv0lUCwHn3yqe8+UwBmmRNgcPRusA+B2x0DIJmBL79GzgzNSprz0WfO1bi1p0T6Gmstba2ADrqGD1Ga6SZk9Rzko6HMNSaoyl8hXoUZHDwbgZ2MTmoKEEKighvjQIITA8AUi1rIEg1L2R5DnKDm6OlhFKjoPGXUY6XJwyCjpR3cwJxAgcfMv5HUd2lvmfs5HdkRWgQbDpOoiEjJ30Jgh0Sh7rht6GAaACR6cIPtQnZNve5+hcieBOA0VHWsbKanRyRhAJ5AStA8E+Ve5RPuICe1sMo+lGSBPY550HA3fy054ticHXr7sUl0PsFnj5Ljs6WD6amBxTA3rPIKZz1PRdcWHKOPi4UIJxFLOWenwqdLb0eg+VohEaPVEUUyKR54gwXjMEykHFV4m6+CjxYCRvpym7nMDV25u9wQhhNboMCJ7ec5yEYfYiJTBFEUl6Gmnu6YsqTHr2yBvxxZtckJIPokbX7LD-hHwYrVHXnBAGYaDgrzAnUEyYoGV8h5B10FbiWpQotYDwdIV4ezh5WDHyJYFNyg+nZPtwij4Fb6V0J36yOegK12QMBxDYBy8+s8FyTKHQgx0kqND7SCe9LD4kboEMS-pQAHlRCEEYbrbf5nw5SMKmcAwKgivXMjvpAo7g0sugcidKr0lW-W3uyov0pcWAL+D2Rw2OOgeM8yVMUIykfqSqGUxgJkTEGepSK6TC8Mm0EurUeIcBCgYYTgxgngT4BgqBkcDQBQ68mWf2-gboN+hBf0G0zUlAa+wGYuGo5BIq943I00Fwe84cOOPoj0Wgb2pg9Ii8JEHB0B3BgMvBBoG+PGtAQh1MTgjgw0GwhM4sug4028I0cqdIj44YmgyhRBzUhsoeUukOiwIhpgHc4hLQkheWDBOOQI8cpglhZQFgS+tiQh8gOgVBuOr2BOToUIW8Wg5h0eZE+gHBm+Qhmi280iJK1QB+22dQykeUj03g7hz0-Iy8NheBcaMWvmLMBobMoE6Rrg+wZQpQxwwSFQd6cIZhHIrgnIDK4Y6eQuXuyy1qNResdR7MJB20jRE0LR6BHcnIHRssIYhQdKqkQoRgcyqRWhtRhoBsIeiS6R5gaCeQSs1hZwj0ssDQzej4SBVGI02xsWux9RUA6aqEaRThGObI948qRWBgCyRUI0yx2Oaxh+IIqsngjxYx2qV8oCG0QhL2XIPgpgTIYYRgKkv+2kHR1IVQ0eYsZwYYUJQ2w8TaY8cJt8SWW+nxDOboqsekKJgoxQ6wmJFI86hQZQqsu8JKAIRJBiiapJdA18zSECQiUCcAQhsyI+TGixCc-IuChEM6JE9eLR5WvJaykoGyGKA6Aszh-sag8s-I2RcingEcdQJEohCuugAIT0KRlRamNWfJGpPyWpfyFiXCPCVJOpXxIqRWoshpsiuRppiAZQgIoBYYSwxQRUapWqmptSba-y7pvClJ6RCIUilwRwQRCOceZ4ukQSZ0lyw+EYdp1WnyxJVSzpcZfK-yuyEA6RhEigFGykCqc03gdIUIqs282gAoTJ7e6C0ZaKNSmK1ZTSU8yZ1JwqZwTu1ugoBgGZ7I4SHIM6fIG2OOqCYBN2kBoxZZrCFZQ5FiNZ4Cgi9A2ydZe2YYTZKgLZdEOU2gNKPRlu4IdI-ZyS6KlZBqw5YCZe4588jgKwDIbo7g9KHIVKTgHI2RIYIZ7oz56yu5Wy+5I5t8eKoKA+2pxKw0gIqwD4CqWULJ8eFQ1Iag9eisCB65UWm5q625SaXKKa8CjRz0ohRUnI1Mj0i8J+FIj01E3+2gCxboII0FJJOqLaPKTqUx+IjR5QDFhMzFbmbFOQPIDZ+O8yh2mwPJxZIupZjpSoVFeqTqRct235-SpU28ZOFwPIqsi8nR8lBwtGBgylx+-FWlApQlqazqNcxqDRBlPqlQieL0XgrQCOKgU6I+KlisAF+gRZQxme6qFFmlMJza1FrafK+oHauYXa4maAHivaRKg+-Sj4TBZgw0XJuh3h2kVl+O1MAY1QSqwOkV+BH60J-mM24pnlxK-wUi4IHI3g1QbgV0EyFVaupURkjFscDl6gjV2m6GolZBLV2Q-oBQAY55XV0qvV2kNpM6GwlwHoeQFxo141o2QmmGTVBmecCJjKQISwtlSwOOrg9GuQ3I3gNEeQlII1al5FqKdWnWh6Y5XpDOxk28TIpg7IFQC8JVFIJ4e+pWxQHQyk-gr4tVVRg2sVe1DWY1j+E27Wn1CJh2aUB4m2J4ZwUIjEDZpgPgLobQjIj0u18WTVh6AAcoIK4nxhKSCM0eCUrAEQ3hMlUE4PyE0MyPpFTq9XwkIfeG0M3sKNWmLEcEThyE4DhdzeCP4KdgEEAA */
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

                onDone: {
                  target: "Showing Login Result",
                  actions: {
                    type: "assignLoginResult",
                    params: ({ event }) => ({
                      loginResult: event.output,
                    }),
                  },
                },
              },
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
