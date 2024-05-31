import { ProfileClient } from '@/features/profile/contract/profileClient';
import { VerseClient, VerseClientForProcess } from '@/features/verse/contract/verseClient';
import { setup, assign, assertEvent, fromPromise } from 'xstate';
import { Preloader } from '../lib/phaser/scenes/Preloader';
import { MainMenu } from '../lib/phaser/scenes/MainMenu';
import { VerseScene } from '../lib/phaser/scenes/VerseScene';
import { listenScene, listenSceneEvent } from '../lib/EventBus';
import { loadVersePhaser } from '../lib/load/verse';

export const renderMachine = setup({
  types: {
    input: {} as {
      initialVerseId?: string,
      clients: {
        profileClient: ProfileClient,
        verseClientForProcess: VerseClientForProcess,
      }
      setVerseIdUrl: (verseId: string) => void
    },
    context: {} as {
      cleanupGameEventListeners?: () => void,

      initialVerseId?: string,
      clients: {
        profileClient: ProfileClient,
        verseClientForProcess: VerseClientForProcess,
      }
      currentScene?: Phaser.Scene,
      typedScenes: {
        preloader?: Preloader,
        mainMenu?: MainMenu,
        verseScene?: VerseScene,
      },
      targetVerseId?: string,
      currentVerseId?: string,
    },
    events: {} as 
      | { type: 'Scene Ready', scene: Phaser.Scene }
      | { type: 'Warp Immediate', verseId: string }
      | { type: 'Warp Overlap Start', verseId: string }
  },
  actions: {
    activateGameEventListener: assign({
      cleanupGameEventListeners: ({ self}) => {
        const c1 = listenScene('scene-ready', (scene: Phaser.Scene) => {
          self.send({ type: 'Scene Ready', scene });
        });
        const c2 = listenSceneEvent((event) => {
          self.send(event);
        });
        return () => {
          c1();
          c2();
        };
      }
    }),
    cleanupGameEventListeners: ({ context }) => {
      context.cleanupGameEventListeners?.();
    },
    assignPreloader: assign(({ event }) => {
      assertEvent(event, 'Scene Ready');
      return { 
        currentScene: event.scene,
        typedScenes: { preloader: event.scene as Preloader },
      };
    }),
    assignMainMenu: assign(({ event }) => {
      assertEvent(event, 'Scene Ready');
      return {
        currentScene: event.scene,
        typedScenes: { mainMenu: event.scene as MainMenu },
      };
    }),
    assignVerseScene: assign(({ event }) => {
      assertEvent(event, 'Scene Ready');
      return {
        currentScene: event.scene,
        typedScenes: { verseScene: event.scene as VerseScene },
      };
    }),
    assignOtherScene: assign(({ event }) => {
      assertEvent(event, 'Scene Ready');
      return { currentScene: event.scene };
    }),
    clearScenes: assign(() => {
      return { currentScene: undefined, typedScenes: {} };
    }),
    startMainMenu: ({ context }) => {
      context.currentScene?.scene.start('MainMenu');
    },
    startVerseScene: ({ context, event }) => {
      // assertEvent(event, "done.invoke.loadVerse")
      context.currentScene?.scene.start('VerseScene', event.output);
    },
    assignTargetVerseId: assign(({ event }) => {
      assertEvent(event, 'Warp Immediate');
      return { targetVerseId: event.verseId };
    }),
    assignTargetVerseIdFromInitialVerseId: assign(({ context }) => ({
      targetVerseId: context.initialVerseId
    })),
    assignCurrentVerseIdFromTargetVerseId: assign(({ context }) => ({
      currentVerseId: context.targetVerseId
    })),
  },
  guards: {
    hasIntialVerseId: ({ context }) => {
      console.log('hasIntialVerseId');
      console.log(context.initialVerseId);
      return context.initialVerseId !== undefined;
    },
    sceneKeyIsPreloader: ({ event }) => {
      assertEvent(event, 'Scene Ready');
      return event.scene.scene.key === 'Preloader';
    },
    sceneKeyIsMainMenu: ({ event }) => {
      assertEvent(event, 'Scene Ready');
      return event.scene.scene.key === 'MainMenu';
    },
    sceneKeyIsVerseScene: ({ event }) => {
      assertEvent(event, 'Scene Ready');
      return event.scene.scene.key === 'VerseScene';
    },
  },
  actors: {
    loadVerse: fromPromise(async ({ input }: {
        input: {
          verseClient: VerseClient,
          profileClient: ProfileClient,
          phaserLoader: Phaser.Loader.LoaderPlugin
        }
      }) => {
        const verseState = await loadVersePhaser(input.verseClient, input.profileClient, input.phaserLoader);
        return {
          verseId: input.verseClient.verseId,
          verse: verseState
        }
      }
    ),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCcwDsJmQWQIYGMALASzTAGIBlfdMAAgCUxcIBPAbQAYBdRUABwD2sYgBdigtHxAAPRAFYAHAHYAdIoCMGgCzKATIr0BmRQE5TegDQhWiZQDZVy00b1uT209s73FAXz9rVAwsPCJSCmpaRmY2dg1eJBAhEXFJaTkEDSNORVUNXyNdc2VFeS9rWwR7TlUjfXt5T1NOPWV5XwCg9EwcAhIyKhoyGJYOPUSBYTEJKSTMjQdTVXsNeR15cvtlfUqFDXVTbM8VDQN5Uq6QYN6wgcjh+iYx9iNJ5Om0udBM4x1VTxnQycIz1RT2Ix7BDrQ7HUync7+QLXHqhfoRVQASTQM1wABtyFx3ikZul5og2ssmooVCY9JxzGZ5FC2mp7G0QfDONoLqCrjc0eEyFi0HQAOK4AC2YBFdAACqg8YIWFgRbiCUTpCSvhkFNo8vZGtkzpx5JTITZEPZvHVOMp6q0LHpvKZ+ai+kKZdjxVKvaKFWAlSrkGrxPjCQktZ9ZrqEOC9OptHpfOsTCprVDrdoVkYzobk-plJ43SEPfdZRLpbKA0HeqoADLKiB0ABqWFgFAgkhlpAAboIANYygVljHeyt++WKpuqxssVvtsAIPuCfC4L5EzVJbUx8nVTgHTbOspuM76i1VFR5eSg5yNZxHHQl27o4Xj32yvCkOjYdAAV1DYhwwAdVwZB+DoTFJWlCAgNEMAtymVJdx+RAdBBVQD3pGlFk0O1lEzYwcy0cwk2UNZDGfQVy3fKtvS-UVfzQAC52bNtkA7cgu2FFch1UEc7jHUUJ0-XBvyYlimwXDilxXNcNx4RCPmQslUKybx5Fteo9AuZ1rWZS04wcOprRccj6lMHY9ACZE0EETB4CSATXzAKMVO+WQKT0KlzE4U0jC8ZwNFMKEAFoNFyVQdOUBlTHWTZFgMKjRzfHEwzxNzSQ834dlUcoWn8wKjhCwy1kcSyahBbQTFiu1ksE1KfWlTKdT3HkE0NVMTTNZwLwpYL1EUblNiKNx7AsZR6pcisP3osTGP-FqUM8rIjHkWptA0MxdGq7JbyhJNHE8AtxsWG9QW0KbPRmujRXYjs6CiMgltUlbFl8VQXDWUFuXtBkNAOnTE3IgwLCKLxLuRZzrtoycAHlREILBHseF7sopNaE1MVYchis1seTQHHHW+oIQZNxFEOq6aOE2b-WnYM0djdbak6416R6lxAeWar9D8lw9GyUjqaEprJxrGcQ2xdUmb3a0Np5IsRrMQwSqqDojDypkQSGgxTpFxqRO9CXg1UShRDA0Qf3mn9Fu3aNXsyMo1G8pQQXqJo2gMqo7ycYK72C8HxoNycjfpwNJbNi3kCt+76Ce1z7fc5mvBWbZ7SC8bnTVtDWgTLQdBisj9MmqH3Qa0O6anCPTdY6SO1ltTylqGLVmqob2XtHOECVzDsmdU0zGTNaQ5ur0IDxROkKy5mgcNFp7SaBlFFcKFcai93fB5ApNhcUfMQnqflJnvcDATJNXEWHIswMbQ1-hT6mlKbzvMaMp7H32nbut8T-0A-FG5vW0MA-I2NfJZz8g4KEu91BaEKBFHwRRIbdFLBXMeolf7MQbFJOOgCFjeAOHnZ+uY371ChO0Wo2RTSkUNDUHSn8xYYIWlg82lt67x1RknE+akhZ5E2ttIsuZQRkNKvzDeWh6T0gCsFD+NkgA */
  id: "renderMachine",

  context: ({ input }) => ({
    ...input,
    typedScenes: {}
  }),

  states: {
    Initial: {
      always: "Idle"
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
                  actions: "assignTargetVerseId"
                }
              }
            },

            "Load Verse": {
              invoke: {
                src: "loadVerse",
                input: ({ context }) => ({
                  verseClient: context.clients.verseClientForProcess(context.targetVerseId!),
                  profileClient: context.clients.profileClient,
                  phaserLoader: context.currentScene!.load
                }),

                onDone: {
                  target: "Start Verse Scene",
                  actions: "startVerseScene"
                }
              }
            },

            "Start Verse Scene": {}
          },

          initial: "Initial"
        },

        "In Verse Scene": {
          type: "parallel",
          exit: "clearScenes",
          entry: "assignCurrentVerseIdFromTargetVerseId"
        },

        "In Other Scene": {
          exit: "clearScenes"
        },

        "In Preloader": {
          exit: "clearScenes",

          states: {
            Initial: {
              always: [{
                target: "Load Verse",
                reenter: true,
                guard: "hasIntialVerseId",
                actions: "assignTargetVerseIdFromInitialVerseId"
              }, {
                target: "Start Main Menu",
                reenter: true,
                actions: "startMainMenu"
              }]
            },

            "Start Main Menu": {},
            "Start Verse Scene": {},
            "Load Verse": {
              invoke: {
                input: ({ context }) => ({
                  verseClient: context.clients.verseClientForProcess(context.initialVerseId!),
                  profileClient: context.clients.profileClient,
                  phaserLoader: context.currentScene!.load
                }),

                src: "loadVerse",
                onDone: {
                  target: "Start Verse Scene",
                  actions: "startVerseScene"
                }
              }
            }
          },

          initial: "Initial"
        },
        Idle: {}
      },

      initial: "Idle"
    },
    Idle: {}
  },

  initial: "Initial",

  on: {
    "Scene Ready": [{
      target: ".In Game.In Preloader",
      guard: "sceneKeyIsPreloader",
      actions: "assignPreloader"
    }, {
      target: ".In Game.In Main Menu",
      guard: "sceneKeyIsMainMenu",
      actions: "assignMainMenu"
    }, {
      target: ".In Game.In Verse Scene",
      guard: "sceneKeyIsVerseScene",
      actions: "assignVerseScene"
    }, {
      target: ".In Game.In Other Scene",
      actions: "assignOtherScene"
    }]
  },

  entry: "activateGameEventListener",
  exit: "cleanupGameEventListeners"
})
