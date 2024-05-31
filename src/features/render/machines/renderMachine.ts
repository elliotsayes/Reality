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
      initialVerseId?: string,
      clients: {
        profileClient: ProfileClient,
        verseClientForProcess: VerseClientForProcess,
      }
      setVerseIdUrl: (verseId: string) => void

      cleanupGameEventListeners?: () => void,

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
    updateUrl: ({ context }) => {
      context.setVerseIdUrl(context.currentVerseId!);
    },
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
  /** @xstate-layout N4IgpgJg5mDOIC5QCcwDsJmQWQIYGMALASzTAGIBlfdMAAgCUxcIBPAbQAYBdRUABwD2sYgBdigtHxAAPRAFYAHAHYAdIoCMGgCzKATIr0BmRQE5TegDQhWiZQDZVy00b1uT209s73FAXz9rVAwsPCJSCmpaRmY2dg1eJBAhEXFJaTkEDSNORVUNXyNdc2VFeS9rWwR7TlUjfXt5T1NOPWV5XwCg9EwcAhIyKhoyGJYOPUSBYTEJKSTMjQdTVXsNeR15cvtlfUqFDXVTbM8VDQN5Uq6QYN6wgbBVAEk0GdwAG3IuSeTptLnQTJtZZNRQqEx6TjmMzyPYINpqextThGUyKTjaC5GIxXG6hfoRJ5oOgAcVwAFsHs86HhSNT0ABXQmvD4AdVwyH4dEeZIpEGIuFEYC+0hSM3S80QOmRqk4Z1ymlKGk4O1hiKMKyMWnM2jaa0MOJ6ePCZEJJPJlKJNMtDNUABlBCw6AA1LCwCgQSQPUgAN0EAGsHri+saLWaKaarXS0Iz7Y6Xcg3QgfYJ8ALZl9hUlRX8MpLvPI6sj9Bc9Np7BjYSpHEZyy5lNlnDs9AaQsH7qbSeGqQAFVBvB29Jnid6fHgi36zXMIEErRrZOXyIFGVXeQvKeqtCylyEt274k1Uzuh3tgfssLBD-kfeLfbOTiUIRSI9Q63zrExV7Qr7Qas72RHbG0ni7ka7aHuaponmeg6xhAzquu6nqqMmAaqEGdwEuBXZElBA4XrB8EJmASZoL6qZ-BmY5ZhO4oAogNQHJspZlG4ZzaIoy42IgKh5PIWLOI0zhHDoIFtphRJHqa8ZunQUQmmyHKkFAl4jgpnLcry-KCpmUypPedFZJoP6mNsxamBcFylKqLSqC02ieEqzgaKCzaBNchpiQeEkQVS0n0HJDxqUpdoDoRbrkB6JooYGHkYV5Yahn5snDIF7L8MFBF+SRZFppIlG3jR-yyJKhgFnx9imOuKJ6Ec6ywluMq6ouizaNV8gBG5aCCJg8BJOh+5gOOem0cVcI1ao5QtJwfFeE5piwgAtEqeR6BcyqQqxSgqKJcUWsyQ1ikVgI7BN5icNNKLFBo81cVkHS2Q451FCYkItMoO0DR25oHTmD4Ynos7vguS6wno13qGiOpePI53ePUH0hl92HUrgtLYAyP36aN2Qw6o2jObNrXZPxsI6gWjR1jVtbTT4CNgd5yORuj0YqW8mMjQs9k-tdFUtBVELKvYsKbMsmgFBxSo+EU2h0+JCURqj1os5lCHs0deayo1bSGJqjQccosLtLU2TTdq-41KtsvxZJVJMzalCiOyohhf5KVq1O2SonjBO6ETWL1LCkvLBCWgQhCKI81boY20SADyoiEFgyW0O7D7GIutmrDkyjTVTehC7dr4TUW9g5FuiivlHSPHn2eHIKnBkw7U-5AxCi7OJxVRQ3j9TXTW2ye-4bn9YjWE16edesw3o3lrU9kXBifFmIYN1VB06pKOZyJogYFUaFXY+QbX57IKoDtOyjaMY9Rw3q4+FyqDVSjIvUTRtDCt0CU410CX3ngVQfBm49oIXnPsgZ2SUArT0yOUH8-4dj1COPzTwgdWgAy0DoHOOoHAYnesPWKn1D49mPjBUKfloEKBsjnVYrU0SInXKvOwGIZTZG3JvfORh2r4NbLtauTwIBvEGjfQ6U5FzkwqsqTh3hUSuFhNnR+L9fAYgKCLbE3C9yjyAVJBCycyAUKyPWPIJkmzlAsjsRQci0S2XqOYlwbRXDmUAfLXyOiAqqCCmgKA+jFj-kziY8y7RzHC3xjKJ8YNGiagMMBdRoE5Yxxdro1KilPFT2Eb9AyzlywrAKM5WUk1FxfluoiPI0i1ibAcbDJx8TIEpXcWlDKZDVZpKxgsTQBZrrXQ6OUaagTKzTXyB+M4pQsSrVct0HhhCtEuKIokupyTlJqQSVA5pHMSrOQGToAwaJNjllQRnUsORXA1H0FuA+AihG6REWnQweNjBg3XD4eyUS5Fe3MroFeVMlAdCqT5IkNTaCqAAKr8AgGmTx+iITmRlJsSRoJWoOE7goeyKwfCQj1OuZwXCAhAA */
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
          entry: ["assignCurrentVerseIdFromTargetVerseId", "updateUrl"],

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
            },

            Updating: {}
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
