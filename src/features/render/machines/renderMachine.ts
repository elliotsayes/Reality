import { ProfileClient } from '@/features/profile/contract/profileClient';
import { VerseClient, VerseClientForProcess } from '@/features/verse/contract/verseClient';
import { setup, assign, assertEvent, fromPromise } from 'xstate';
import { Preloader } from '../lib/phaser/scenes/Preloader';
import { MainMenu } from '../lib/phaser/scenes/MainMenu';
import { VerseScene } from '../lib/phaser/scenes/VerseScene';
import { listenScene, listenSceneEvent } from '../lib/EventBus';
import { loadVersePhaser } from '../lib/load/verse';
import { AoContractClientForProcess } from '@/features/ao/lib/aoContractClient';

export const renderMachine = setup({
  types: {
    input: {} as {
      playerAddress: string,
      initialVerseId?: string,
      clients: {
        aoContractClientForProcess: AoContractClientForProcess,
        profileClient: ProfileClient,
        verseClientForProcess: VerseClientForProcess,
      }
      setVerseIdUrl: (verseId: string) => void
    },
    context: {} as {
      playerAddress: string,

      initialVerseId?: string,
      clients: {
        aoContractClientForProcess: AoContractClientForProcess,
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
      context.currentScene?.scene.start('VerseScene', {
        playerAddress: context.playerAddress,
        verseId: event.output.verseId,
        verse: event.output.verse,
        aoContractClientForProcess: context.clients.aoContractClientForProcess
      });
    },
    warpVerseScene: ({ context, event }) => {
      // assertEvent(event, "done.invoke.loadVerse")
      context.typedScenes.verseScene!.warpToVerse(
        context.playerAddress,
        event.output.verseId,
        event.output.verse,
        context.clients.aoContractClientForProcess
      );
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
    updateVerseSceneEntities: ({ context, event }) => {
      console.log('updateVerseSceneEntities', event);
      const { entities, profiles } = event.output as {
        entities: Awaited<ReturnType<VerseClient['readEntitiesStatic']>>,
        profiles: Awaited<ReturnType<ProfileClient['readProfiles']>>,
      };
      context.typedScenes.verseScene!.mergeEntities(entities);
    },
    sendRegistrationConfirmed: ({ self }) => {
      console.log('sendRegistrationConfirmed');
      self.send({ type: 'Registration Confirmed' });
    },
  },
  guards: {
    hasIntialVerseId: ({ context }) => {
      console.log('hasIntialVerseId', context.initialVerseId);
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
        const entities = await input.verseClient.readEntitiesStatic();
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
  /** @xstate-layout N4IgpgJg5mDOIC5QCcwDsJmQWQIYGMALASzTAGIBlfdMAAgCUxcIBPAbQAYBdRUABwD2sYgBdigtHxAAPRAFYAnAEYAdAA51igEy752gMyL5WgDQhWiALTL1qgGzqDB+-ZcAWAOxL7n9QF9-c1QMLDwiUgpqWkZmNnZlXiQQIRFxSWk5BGVtRU9VThU85WNteUd3c0sEGztHZ1cPb0V7HUDg9EwcAhIyKhoyWJYObSSBYTEJKWSs3QN85WV7eU53Q04lRSrrWwcnFzd7Lx8j9pAQrvDeqIH6JmH2AzGUifTp0CyDd2VODVyj7SeFRzTzbbIGVQHTyudzueTzdycbT2M4XMI9SKqACSaEmuAANuQuM9UpMMjNEIDFKp5O5NJ4DOptIVFFp5GDAfl7IDOEZ1Kt5AyDKjOuiImRsWg6ABxXAAWzAkroeFIyvQAFdJXjCQB1XDIfh0LFyhUQYi4URgYnSUlvTKIZSIiGcHKcTTKPw-TygiyIbkQtyLRSKNaeZQmbQi0LdcWKnEy+VxqUq5Ma1QAGUELDoADUsLAKBBJIrSAA3QQAa0VaJj1yVsoVSpTarQmsz2bzyALCDLgnwFqmxOtyVtU3t2UR8khvM8ZVn7iO7N9CHU0MhR0U82U8zys6jlwxEvjDaTdAACqh8VmulrxASiTwba8xxSELS6stt679ECDGCjr8BicAynhIjo2iIoo+5inWx6JkqF5gFeLBYLe5qEgkJLPuSHyIOo3IaGsjjyNu9JHP+sIOAYOSuMis6eO4UFBOcoq1picGNvGiHITe7YQLm+aFsWqi9lWqg1lc7FSieCGXteqF8QJXZgD2aDlv2bxDo+I7Ye8sh+i6NL6HS+jaDkdJ-suq52PCO7LECKiOtBbFHtJ8Hxp2BZ0NEEp6gapBQGh95+YaxqmualrDuMaQvrh2TqI6qgtN6ZTGN43rqP+ii-NlsIqMBKiaJGzESYep4yR5gnebcqghQFGbXkpBbkEWEqidWrGSa5CacVKnn0D5ip1WggWKf1qnqQOkhaVhMU4fp8VlDSLh5M4OgqCRYLgQUgLhmZDFGGUzldeV7l9VVg2qAAomg4iiKwdAACKCAA7mgPHYhA+IUDIsCiBaiq4AAZpayAABQrJwnAAJTkKVsb1mdTUDTVN13Q9z1vR9WJfVa2nRWSemzGsU7btC8K2G6-z-kBqigQYzK0s4DFuMdZWI71yPVbQ123WIGOve916qAAqvwEAA3QaOTHALXCe14mdezHGnv13MStL91PYLH1ixLlpS3z4hwBNfZTWgM1PnNROUo61JGPMbqMv8LRgt47iqD8SxlN7XwLmzCMq0qauXWe+K4KwWDnrpqhnrpdAAIrqmAyefd95B65LcfW1FLzW+OuiGXCRRAm4DJLtU24MzS3wenO8j6KyAewW5nMhzVYcR1H2eE7H8di9juPkEwUDEH9yDm3QADCkhA8QyCmrno7zbMtL2NOwFhvTTirGCOTBgUjruEB9gFaBKIlUrget6rF0d+HkfINH1t99bdAD8LmcGz3bxy21amVg6tGE6HNb7KXVoqTuj9n69x-lMd+-BdbiyzrpU2GlBw8CXrpAutJ7bQlKFoVYXwK4OlpGoN0rJcicHqKcS+wDlY32DnfHmUDu4xzgZIBBH17hsAfLNQmBcnAezdHCFY1F8JfB9JXJ0kISLqFpAyHktCOj0Ovj1MBXlLqaweiPMeogJ5vCChhfGecBGvm0E4deCIEqFV0NoMEgp14tEdEiAwKwlAmGblJdRTDwFaKNjosAo9x7m1ULov6WAAp-xLAAsS8MW4+Mqn41GATYjBP0aE8JoMApoPNpbHS+dzHQg9o3MorQnA6GUG7OkGhZwlBMt8XQngvHdQqudZJPNtFpL0QYqYtVcCTBGnQIGggn74FnsQOU5tyC-X+paVQwNQZgx+FDWG8TvFtK5v49G3SQmGL1IMqAwzRl0HGWgOeUzNImOXjbBAQEakJQFNyR05QSEID8B7cMdILEN3mEYJizE0CCEwPAZI6yyBWzMXFXQ1JNhQ3hCGIEJQwQ2D8BocRNFbDOGcO4FpSZtSQrtEU-IcKNhGC8EUPe5QkrQihl8RkLJgJ4tAYS2KC04TaAcJ+aijMqSWUrktQEXgMXGAZn4ZlQd4zNmwBqVlK8HRuN+N8LQXhj5V3mGCEmDglB+wYroY+xgJWMKlQM1MrYjFytuUfT5LRgzUJ0FDaEDilAaEWPUFZbhYRGsScmU1LY2yNX6pa8cLjyFNKZNRZYTgpGIG8L8bcGxgwLlcEieQ3rNnSrTJQf6yBRBbNuMG1825WSqGVYitV2KY3ZChtSZkixmTMiMCUC+KiDxqM2QAeVEIQKOg1C1xT9rW4MGVoSgU2sueY+RqJIiBAyT8eQW0sVUQkzZ3F5LIH7QtSGXKSI8o2HyzVuRS3zDKKuUC1DPF0LbSupGa6ULIAtQUqFC0AKlrhAxX5WgmRbGXOUCEJhjC8n5BY1oyh023rkve1Q2b9R5sza2TdWR5H5FyCYXk8xaSAjeaXOmJRS4lC+La8DnM703hg7m-NtBEMKBDFy70O4lg6EYnvJEnLFiOlAqGRczSr0wQ2RBpC66GodkEtRt82U6bUMdAy7kDIf3VA-YfBmk4tDIjccRuMuMxMkV+C6CMjF1CNO+G86inz4SnxAylWkabeMuVOm3ZhEKn1Erih6XYyVZwePSn4DkOQaQLqcLkRiDImQad8Zomqw0oBiY9K4JKvhPNpUFD5393wCj4TKMfQo5TF3gvsxolGPMouPoJi5hatgjgOCWJTcMwZjL-gsaWwo4ZflUNWGFpJEWiv6n4PVMaonnNsqyLYcMnsiivOyoKQUYJ+Sk0ZAlQE+wyjFVbXx1pSN27df8iNfpBpKNOdK0Nh0CU7BfjWJoDY5RKjLh+PoVQEEgIM1PrOcCHX2ldY1qkzGQsWBibMoZB2oEnDftaPYBxx9IT8nuf92kcI3v7cVF077g9vp-cbXTZ5J9oSGc0DTNQDdON8h5PMeHm3Ps7OR5-ZBBtNbEDgH94+681WsmdrCJYbsXCltsH++RJ3SeOcgQ-NhhTDvyoQMyPIBQMOAeyrOTKN3Vj22A4iCCdJqG5avjehzHSJSsKfhwtAr9CaJ2TsnP7LypfNBWLLixe9tzryZD8QEvhVUMn5zrwXXd9fsPjknFOmnUeDbF2ZTcluPGFGArbm7PIaVip5N4FYPHVt2dAeFwruuhfe5fgbrh14GclqApvD0QH7l285-TR0jpHBQ0M+7j7nvoEG6N28XPLA05gD+-YD0kOFxeGWCRWw12BUQR2qfIiwIfjClsyAyV7308N+F7A-uiCqf63oAbv7liHBhli6fFok4qWMhpL4RXerqINzr-P2OmeYGGJzx-NvPDqii9uciQo-mDP8hnYYflDpjN02UzWF2nwiZWnwYR9QR15h2SyV6XmhuQLjDHXlKXKBZ0qUPQ9hC2cASlPlYyTyXWvX4213rygP5l2QyUMRxAJSD1fyEVLQggXQOjdDeRIk5Sk0ME3ECwgg12XUIIKwgRIK1hgNCWegO1MTK0+C9gKAsyuwjFu3-AYnSydFSgSi9TAPbQ2wFwEMCXSVgMNyyUiRGj+29DM3DHkRQJdHkz9CPx0HsjKF5GAlcEv34K6SEP2QGXECGRGTGQmUuTZXgKKVaFLVPiZGsl-EsJXEMDfUYl5DWEcjaDUNgi02oMEU5TWAZg9BPlhAsSH0QD5CSgUW-X+BMHKECECCAA */
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
                    "1000": "Update Entities"
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
