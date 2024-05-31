import { ProfileClient } from '@/features/profile/contract/profileClient';
import { VerseClient, VerseClientForProcess } from '@/features/verse/contract/verseClient';
import { setup, assign, assertEvent, fromPromise } from 'xstate';
import { Preloader } from '../lib/phaser/scenes/Preloader';
import { MainMenu } from '../lib/phaser/scenes/MainMenu';
import { VerseScene } from '../lib/phaser/scenes/VerseScene';
import { listenScene } from '../lib/EventBus';
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
      cleanupEventListener?: () => void,

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
    },
    events: {} as 
      | { type: 'Scene Ready', scene: Phaser.Scene }
      | { type: 'Warp Overlap Start', verseId: string }
  },
  actions: {
    activateEventListener: assign(({ self }) => ({
      cleanupEventListener: listenScene('scene-ready', (scene: Phaser.Scene) => {
        self.send({ type: 'Scene Ready', scene });
      })
    })),
    cleanupEventListener: ({ context }) => {
      context.cleanupEventListener?.();
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
      console.log('startVerseScene');
      console.log(event);
      context.currentScene?.scene.start('VerseScene', event.output);
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
  /** @xstate-layout N4IgpgJg5mDOIC5QCcwDsJmQWQIYGMALASzTAGIBlfdMAAgCUxcIBPAbQAYBdRUABwD2sYgBdigtHxAAPRAGYALPIB0igGwBOdZ0UBWTQCYAjIoAcx+QBoQrRAHYzK9fL26Ne+fLNmDAXz8bVAwsPCJSCmpaRmY2dmNeJBAhEXFJaTkEdXVFFTNFXXt7eUMNbxs7BEVc6qL1Q3s9OuNjQ3UAoPRMHAISMioaMhiWDkNEgWExCSkkzONdPTytHQ18zQsKxC0VdcM9RXtFQ20TXQ6QYO6wvsjB+iYR9nlx5Mm0mdA52pVDU59VzjyTSaTZZThqaqaPRmTj7MxKLznS6hXoRFQASTQU1wABtyFwXikpulZogWqocpwXMDSupjD5DKC9uoVC1FJpimZNLDNAckV0UeEyBi0HQAOK4AC2YBFdAACqgcYIWFgRdi8QTpET3hkFPZDDsmo1AeofEZGbYtoYnJxfsY3PbFPbXPyQj0hTLMeKpZ7RQqwEqVcg1eJcfiElq3tNdVlqjsckD9iUDrpQTpFsdGp5jIcPIZXVdUcKvRLpbL-YHuioADLKiB0ABqWFg9Ci-QgkhlpAAboIANYy5Hum6y0u++WKuuq2ssRvN1t3BA9wT4XDvAmapLa6OkhDeFk8qFGdkwjnqUG+Jxmeym8xuMzHI4BQIgNCCTDwJJD64RSOpHefFsFLckUpjrE6OZ6KCAC0LSLPYnBUnoeilK46yaAWgojpi6p-sSHyyGSLTOCB9hgfkLSNKCliLGUmjyI0pStGcL7fkW45jnhOq7oYXgqCU+qwvInBGCUObUes-GcI0D50uoej1DmmHDmiJY+rKeCkHQ2DoAArlxAGEQghz2CoIm8sClKAhalTWosLiwra8lHAYgLKT+xaimOspNsgLZ0G2YAGSSgEIC0xgHtyxjAkYeiWBoTK+M4wluG0+x7Ny8juexo7qV6ADyoiEFgAV3MFBFfPoaj6sCyEOUU1iWggdnJY5aUuZl2UerlZZehWU7IOVMYlOCDGaPM0JReyiigk6TiJqU9F0vCyZddhXl5X6k5BiGxC4kNu5HMYOzeD4lHWsJpSgshBr7I0jQaC0dlrapG29VtAYDSolCiLgyCiNpuBaTpaD6VuUYhUZ1JqJBljZNyJgzU1938WYOjwvMVLXsYL2ed670Tp9O0-X9AO+f5gUHaF8imvx9jjbCXKcGBSOVOsqg3nd1kNPsii4xxm2E5W051nOfkLrQVNGQxLILdC2YofkoLFKoHI0cm+T0xhrECipePeeiEA4kF4P-pDmTWsdAmGEJIm8SY9igsJmhmfo0XSTb8zeHo-MYkbJsTGbFVESycUnkomP1GRTtFBCDQ5szCla1lz5AA */
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
          exit: "clearScenes"
        },

        "In Verse Scene": {
          type: "parallel",
          exit: "clearScenes"
        },

        "In Other Scene": {
          exit: "clearScenes"
        },

        "In Preloader": {
          exit: "clearScenes",

          states: {
            Initial: {
              always: [{
                target: "Load Verse Scene",
                reenter: true,
                guard: "hasIntialVerseId"
              }, {
                target: "Start Main Menu",
                reenter: true,
                actions: "startMainMenu"
              }]
            },

            "Start Main Menu": {},
            "Start Verse Scene": {},
            "Load Verse Scene": {
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

  entry: "activateEventListener",
  exit: "cleanupEventListener"
})
