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
    warpVerseScene: ({ context, event }) => {
      // assertEvent(event, "done.invoke.loadVerse")
      context.typedScenes.verseScene!.warpToVerse(event.output.verseId, event.output.verse);
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
  /** @xstate-layout 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 */
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
                  verseClient: context.clients.verseClientForProcess(context.targetVerseId!),
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

        Idle: {},

        "In Verse Scene": {
          exit: "clearScenes",
          entry: "assignCurrentVerseIdFromTargetVerseId",

          states: {
            Warping: {
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
                      target: "Warp Verse Scene",
                      actions: "warpVerseScene"
                    }
                  }
                },
                "Warp Verse Scene": {}
              },

              initial: "Initial"
            }
          },

          type: "parallel"
        }
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
    }]
  },

  entry: "activateGameEventListener",
  exit: "cleanupGameEventListeners"
})
