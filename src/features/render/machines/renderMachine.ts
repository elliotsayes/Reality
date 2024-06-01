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

      nextPosition?: Array<number>,
      processingPosition?: Array<number>,
    },
    events: {} as 
      | { type: 'Scene Ready', scene: Phaser.Scene }
      | { type: 'Warp Immediate', verseId: string }
      // | { type: 'Warp Overlap Start', verseId: string }
      | { type: 'Update Position', position: Array<number> }
      | { type: 'Registration Confirmed' }
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
    clearCurrentVerseId: assign(() => ({
      currentVerseId: undefined
    })),
    updateUrl: ({ context }) => {
      context.setVerseIdUrl(context.currentVerseId!);
    },
    assignNextPosition: assign(({ event }) => {
      assertEvent(event, 'Update Position');
      return {
        nextPosition: event.position
      };
    }),
    consumePositionFromQueue: assign(({ context }) => ({
      processingPosition: context.nextPosition,
      nextPosition: undefined
    })),
    clearPositionQueue: assign(() => ({
      nextPosition: undefined
    })),
    clearProcesssingPosition: assign(() => ({
      processingPosition: undefined
    })),
    updateVerseSceneEntities: ({ event }) => {
      console.log('updateVerseSceneEntities', event);
    },
    sendRegistrationConfirmed: ({ self }) => {
      console.log('sendRegistrationConfirmed');
      self.send({ type: 'Registration Confirmed' });
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
    hasNextPosition: ({ context }) => {
      console.log('hasNextPosition');
      console.log(context.nextPosition);
      return context.nextPosition !== undefined;
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
        console.log('loadVerse');
        const verseState = await loadVersePhaser(input.verseClient, input.profileClient, input.phaserLoader);
        return {
          verseId: input.verseClient.verseId,
          verse: verseState
        }
      }
    ),
    updateEntities: fromPromise(async ({ input }: {
        input: {
          verseClient: VerseClient,
          profileClient: ProfileClient
        }
      }) => {
        const entities = await input.verseClient.readAllEntities();
        const profiles = await input.profileClient.readProfiles(Object.keys(entities));
        return {
          entities,
          profiles,
        };
      }
    ),
    updatePosition: fromPromise(async ({ input }: {
        input: {
          verseClient: VerseClient,
          position: Array<number>
        }
      }) => {
        console.log('updatePosition', input.position);
        return await input.verseClient.updateEntityPosition(input.position);
      }
    ),
    registerEntity: fromPromise(async ({ input }: {
        input: {
          verseClient: VerseClient
        }
      }) => {
        const verseParams = await input.verseClient.readParameters();
        const msgId = await input.verseClient.createEntity({
          Type: 'Avatar',
          Position: verseParams['2D-Tile-0']?.Spawn || [0, 0]
        });
        return msgId;
      }
    ),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCcwDsJmQWQIYGMALASzTAGIBlfdMAAgCUxcIBPAbQAYBdRUABwD2sYgBdigtHxAAPRAFYAnAEYAdAA51igEy752gMyL5WgDQhWiALTL1qgGzqDB+-ZcAWAOxL7n9QF9-c1QMLDwiUgpqWkZmNnZlXiQQIRFxSWk5BGVtRU9VThU85WNteUd3c0sEGztHZ1cPb0V7HUDg9EwcAhIyKhoyWJYObSSBYTEJKWSs3QN85WV7eU53Q04lRSrrWwcnFzd7Lx8j9pAQrvDeqIH6JmH2AzGUifTp0CyDd2VODVyj7SeFRzTzbbIGVQHTyudzueTzdycbT2M4XMI9SKqACSaEmuAANuQuM9UpMMjNEIDFKp5O5NJ4DOptIVFFp5GDAfl7IDOEZ1Kt5AyDKjOuiImRsWg6ABxXAAWzAkroeFIyvQAFdJXjCQB1XDIfh0LFyhUQYi4URgYnSUlvTKIZSIiGcHKcTTKPw-TygiyIbkQtyLRSKNaeZQmbQi0LdcWKnEy+VxqUq5Ma1QAGUELDoADUsLAKBBJIrSAA3QQAa0VaJj1yVsoVSpTarQmsz2bzyALCDLgnwFqmxOtyVtU3t2UR8khvM8ZVn7iO7N9CHU0MhR0U82U8zys6jlwxEvjDaTdAACqh8VmulrxASiTwba8xxSELS6stt679ECDGCjr8BicAynhIjo2iIoo+5inWx6JkqF5gFeLBYLe5qEgkJLPuSHyIOo3IaGsjjyNu9JHP+sIOAYOSuMis6eO4UFBOcoq1picGNvGiHITe7YQLm+aFsWqi9lWqg1lc7FSieCGXteqF8QJXZgD2aDlv2bxDo+I7Ye8sh+i6NL6HS+jaDkdJ-suq52PCO7LECKiOtBbFHtJ8Hxp2BZ0NEEp6gapBQGh95+YaxqmualrDuMaQvrh2TqI6qgtN6ZTGN43rqP+ii-NlsIqMBKiaJGzESYep4yR5gnebcqghQFGbXkpBbkEWEqidWrGSa5CacVKnn0D5ip1WggWKf1qnqQOkhaVhMU4fp8VlDSLh5M4OgqCRYLgQUgLhmZDFGGUzldeV7l9VVg2qAAomg4iiKwdAACKCAA7mgPHYhA+IUDIsCiBaiq4AAZpayAABQrJwUMAJTkKVsb1mdTUDTVN13Q9z1vR9WJfVa2nRWSemzGsU7btC8K2G6-z-kBqigQYzK0s4DFuMdZWI71yPVbQ123WIGOve916qAAqvwEAA3QaOTHALXCe14mdezHGnv13MStL91PYLH1ixLlpS3z4hwBNfZTWgM1PnNROUo61JGPMbqMv8LRgt47iqD8SxlN7XwLmzCMq0qauXWe+K4KwWDnrpqhnrpdAAIrqmAyefd95B65LcfW1FLzW+OuiGXCRRAm4DJLtU24MzS3wenO8j6KyAewW5nMhzVYcR1H2eE7H8di9juPkEwUDEH9yDm3QADCkhA8QyCmrno7zbMtL2NOwFhvTTirGCOTBgUjruEB9gFaBKIlUrget6rF0d+HkfINH1t99bdAD8L9xsA+s2EwXTgezdHCFY1F8JfB9JXJ0kISLqFpAyHkpxL7RhOhzW+yl1aKk7o-Z+vce5vHfvwXW4ss66Tlm1NSlYOrIOVjfYOd8eZYO7jHPBUwCFEP1vQFhkhTYaUHDwJeukC60nttCUoWhVhfArg6Wkag3SslyJweoiCOjUOvj1NBXlLqaweiPMeogJ5vCChhfGec-6vm0E4deCIEqFV0NoMEgp14tEdEiAwKwlAmGblJdRdD0FaKNjosAo9x7m1ULov6WAApkJLBQsS8MW4+Mqn41GATYjBP0aE8JoMAo8PNpbHS+dzHQg9o3MorQnA6GUG7OkGhZwlBMt8XQngvHdQqudZJPNtFpL0QYqYtVcCTBGnQIGggn74FnsQOU5tyC-X+paVQwNQZgx+DDOGV8EltK5v49G3SQmGL1IMqAwzRl0HGWgOeUzNImOXjbBAQEakJQFNyR05QpEID8B7cMdILEN3mEYJizE0CCEwPAZI8TIhWzMXFXQ1JNhQ3hCGIEJQwQ2D8BoUBthchuMYi4FpSZtSQrtEU-IcKNhGC8EUPe5QkrQihl8RkLJgJ4tQYS2KC04TaAcJ+aijMqSWUrktQExwyiKOPsiYUSCDxqM2c2bAGpWUrwdG4343wtBeGPlXeYYISYOCUM4Uy3JjLuGZUHeMsq0w4gJQUqFC0j6fJaMGRROgobQgcUoDQix6grLcLCE1tCzUDNTK2BqHZBIKtuS42RTSmTUWWE4CBiBvC-G3BsYMC5XBInkH6xJyZA0tk1JQf6yBRBbNuOG8c25WSqFVYijVzgtXLhWdSZkixmTMiMCUC+KipUbKRgAeVEIQKOg1y2vj9s24MGVoSgU2sueY+RqJIiBAyT8eQu0sVUb2zm3F5LIFHXFSGXKSI8o2Hy7VuRq1bgbjodQdI9ySpgt4zZO6ULICMfuhaAFq1wgYr8rQTItjLnKBCEwxheT8gsa0ZQ2bn1yVfaoQt+oS3mtbB+rIsD8i5BMLyeYtJARvNLnTEopcShfAdTBpGL6byIeLaW2gaGFAhi5d6HcSwdCMT3kiTlixHSgVDIuZpD6XKnW3XB3ijV+oMbfNlOmijHQMu5AyQD1Rf2HwZpOLQ4qs1CZQaa3GUmSK-BdBGRit7zLhjBNRT58JT6QZSrSbT3bH2tKRu3ej1qiVxQ9LsZKs4PHpT8ByHINJdyLFeToew0GdM0JzXR3y+p+ABSkx6VwSVfB+bSoKQLQHvgFHwrkPIjEobbgo23eh8X-IjXfR5tlWRbBHAcEsSm4ZgzGX-BY6thRwy-IUasUrGiUY82GqNCTYaauKviuGT2RRwsbHSmCfkpNGQJUBPsMoxUnPCdQb4zRNVhv9INHFsAyWEp2C-GsTQGxyiVEbae1QEEgIM1PrOcC-WduDY1qkzGQsWBSbMoZB2oEnAAdaPYBxx9IQQYXAidbTFNu6f9e03bnSvs62Fjjb6f32102eSfaEt7NA0zUA3PjfIeTzDe0k5Hn2dnffYZLTWxA4B-ePuvDVrJnawiWG7Fw1bbDAdgadynSOPuYIfkwwpBNPMLWZHkAouGwPZVnJlW7jFIdIm+I4PwLoJXw5i5stzEpGFPy4WgV+hNE7J2Tn9l58vmgrCVxYve2515MmAqlBmGvhdHdjuLk3zD45JxTnGfT43blmU3HbjxhR3cq4FaBGlDN6LAQbky6L0rXPlbF13f3L9TdsOvCzqtQFN4enA-c53vP6Y-EaTkfa3vDfZ+wab83+CP4sDTsdsPBdIsLtvUccmJFbA3YFRBHap8iLAh+LrjdPan2Z46Ubv3ODDH5-bxAUWxCDam7+5YhwYYUunxaJOKljIaS+FWIVww3WG9Z99znlffS1+EM-nEaoUvauUiPyF0z-Il2GH5QdG+CnHgVhCaXqzTz1wzzK0X0VC6SyV6XmhuQLjDHXlKXKA50qXPQ9gZCZH5AZj+UWFv1gN5h2QQNCUtTvHxF3y+GrQgjXQOjdDeRIk5Tk0ME3CcF0H9nTy3QGwwVIP5l2QyUMWejICk0XVkVs2uwjB+DeV8EAVvV5FSgSl9R4PnxgOpzgNSXIMMSyUiRGj+29Gs3DFgQwJdGUz9DPwi0FBFSAmhHXXBRcw0NFwEK1h0L6QOXECGRGTGQmUuTZWQKKVaGrVPjwL8F-AsJXEMG-SKy+FyCDA21n2cxD0x273MSZDoIZg9BPjANvUsyrWMC8AA3+BMHKECECCAA */
  id: "renderMachine",

  context: ({ input }) => ({
    ...input,
    typedScenes: {},
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
          exit: ["clearCurrentVerseId", "clearScenes"],
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

            "Entity Download": {
              states: {
                Idle: {
                  after: {
                    "50000": "Update Entities"
                  }
                },
                "Update Entities": {
                  invoke: {
                    src: "updateEntities",
                    input: ({ context }) => ({
                      verseClient: context.clients.verseClientForProcess(context.currentVerseId!),
                      profileClient: context.clients.profileClient
                    }),
                    onDone: {
                      target: "Idle",
                      actions: "updateVerseSceneEntities"
                    }
                  }
                }
              },

              initial: "Idle"
            },

            "Player Position": {
              states: {
                "Position Queue": {
                  states: {
                    Idle: {
                      on: {
                        "Update Position": {
                          target: "Idle",
                          actions: "assignNextPosition"
                        }
                      }
                    }
                  },

                  initial: "Idle",
                  exit: "clearPositionQueue"
                },

                "Position Upload": {
                  states: {
                    Idle: {
                      on: {
                        "Registration Confirmed": "Ready"
                      }
                    },

                    "Update Position": {
                      invoke: {
                        src: "updatePosition",
                        input: ({ context }) => ({
                          verseClient: context.clients.verseClientForProcess(context.currentVerseId!),
                          position: context.processingPosition!,
                        }),
                        onDone: {
                          target: "Ready",
                          actions: "clearProcesssingPosition"
                        }
                      }
                    },

                    Ready: {
                      always: {
                        target: "Update Position",
                        guard: "hasNextPosition",
                        actions: ["consumePositionFromQueue"],
                        reenter: true
                      }
                    }
                  },

                  initial: "Idle"
                }
              },

              type: "parallel"
            },

            "Entity Registration": {
              states: {
                Initial: {
                  always: "Registering"
                },

                Done: {},

                Registering: {
                  invoke: {
                    src: "registerEntity",
                    input: ({ context }) => ({
                      verseClient: context.clients.verseClientForProcess(context.currentVerseId!)
                    }),
                    onDone: {
                      target: "Waiting for confimation",
                      reenter: true
                    }
                  }
                },

                "Waiting for confimation": {
                  after: {
                    "1000": {
                      target: "Done",
                      actions: "sendRegistrationConfirmed"
                    }
                  }
                }
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
    }, ".In Game.In Other Scene"]
  },

  entry: "activateGameEventListener",
  exit: "cleanupGameEventListeners"
})
