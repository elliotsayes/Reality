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
      lastEntityUpdate?: Date,

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
        entities: Awaited<ReturnType<VerseClient['readEntitiesDynamic']>>,
        profiles: Awaited<ReturnType<ProfileClient['readProfiles']>>,
      };
      context.typedScenes.verseScene!.mergeEntities(entities);
    },
    saveLastEntityUpdate: assign(({ event }) => ({
      lastEntityUpdate: event.output.beforeTimestamp
    })),
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
          profileClient: ProfileClient,
          lastEntityUpdate?: Date,
        }
      }) => {
        const beforeTimestamp = new Date();
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const entities = await input.verseClient.readEntitiesDynamic(input.lastEntityUpdate ?? oneMinuteAgo);
        const profiles = await input.profileClient.readProfiles(Object.keys(entities));
        return {
          entities,
          profiles,
          beforeTimestamp,
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
  /** @xstate-layout N4IgpgJg5mDOIC5QCcwDsJmQWQIYGMALASzTAGIBlfdMAAgCUxcIBPAbQAYBdRUABwD2sYgBdigtHxAAPRAFYAnAEYAdAA51igEy752gMyL5WgDQhWiALTL1qgGzqDB+-ZcAWAOxL7n9QF9-c1QMLDwiUgpqWkZmNnZlXiQQIRFxSWk5BGVtRU9VThU85WNteUd3c0sEGztHZ1cPb0V7HUDg9EwcAhIyKhoyWJYObSSBYTEJKWSs3QN85WV7eU53Q04lRSrrWwcnFzd7Lx8j9pAQrvDeqIH6JmH2AzGUifTp0CyDd2VODVyj7SeFRzTzbbIGVQHTyudzueTzdycbT2M4XMI9SKqACSaEmuAANuQuM9UpMMjNEIDFKp5O5NJ4DOptIVFFp5GDAfl7IDOEZ1Kt5AyDKjOuiImRsWg6ABxXAAWzAkroeFIyvQAFdJXjCQB1XDIfh0LFyhUQYi4URgYnSUlvTKIZSIiGcHKcTTKPw-TygiyIbkQtyLRSKNaeZQmbQi0LdcWKnEy+VxqUq5Ma1QAGUELDoADUsLAKBBJIrSAA3QQAa0VaJj1yVsoVSpTarQmsz2bzyALCDLgnwFqmxOtyVtU3t2UR8khvM8ZVn7iO7N9CHU0MhR0U82U8zys6jlwxEvjDaTdAACqh8VmulrxASiTwba8xxSELS6stt679ECDGCjr8BicAynhIjo2iIoo+5inWx6JkqF5gFeLBYLe5qEgkJLPuSHyIOo3IaGsjjyNu9JHP+sIOAYOSuMis6eO4UFBOcoq1picGNvGiHITe7YQLm+aFsWqi9lWqg1lc7FSieCGXteqF8QJXZgD2aDlv2bxDo+I7Ye8sh+i6NL6HS+jaDkdJ-suq52PCO7LECKiOtBbFHtJ8Hxp2BZ0NEEp6gapBQGh95+YaxqmualrDuMaQvrh2TqI6qgtN6ZTGN43rqP+ii-NlsIqMBKiaJGzESYep4yR5gnebcqghQFGbXkpBbkEWEqidWrGSa5CacVKnn0D5ip1WggWKf1qnqQOkhaVhMU4fp8VlDSLh5M4OgqCRYLgQUgLhmZDFGGUzldeV7l9VVg2qAAomg4iiKwdAACKCAA7mgPHYhA+IUDIsCiBaiq4AAZpayAABQ-JwnAAJTkKVsb1mdTUDTVN13Q9z1vR9WJfVa2nRWSemzIy+TImZQG+BUmj-poqjfOo5SMiYtjHWViO9cj1W0Ndt1iBjr3vdeqgAKr8BAAN0GjkxwC1wnteJnVsxxp79VzEpS-dT0Cx9ovi5aku8+IcATX2U1oDNT5zUTlKOtSRjzG6jL-C0YLeO4qg-EsZRe18C6swjytKqrl1nviuCsFg566aoZ66XQACK6pgEnn3feQusS7HVtRS8VvjrohlwkUQJuAyS7VNuBjaDS3wenO8j6Ky-uwW5HPBzVofh5HWeEzHcei9juPkEwUDEH9yBm3QADCkhA8QyCmjno7zbMtL2NOwFhqBjJAZUy45MGBSOu4FMFaBKIlYrAetyrF0d2HEfIFHVt91bdAD0LGf6z3byy21amVg6tGE67Nb7KTVoqTuj9n69x-lMd+-AdZi0zrpE2GlBw8CXrpfOtI7bQlKFoVYXxy4OlpGoN0rJcicHqKcS+wClY3yDnfbmUDu7RzgZIBBH17hsAfLNQm+cnDuzdHCFY1F8JfB9BXJ0kISIMy8FXc+7hm5SR6mAryl0NYPRHmPUQE83hBQwvjXOAjXzaCcOvBECVCq6G0GCQU68WiOiRAYFYSgTAqO6hVc64DNGG20WAUe48zaqB0X9LAAU-4lgAWJeGLc1FMN8ajfxsQgl6JCWE0GAU0FmwtjpPOZjoTu0bmUVoTgdDKFdnSDQs4SgmW+LoTwnjTpt2YerFJmT9FTFqrgSYI06BA0EE-fAs9iByjNuQX6-1LSqGBqDCGUMYZwyvvE7xnM-Ho1Sborpkgel9KgAMoZdARloDnuMzSxjl7WwQLvOwCUBTckdOUEhCA-Du3DHScxDd5hGCYsxNAghMDwGSHEyIltTFxV0NSTYUN4QhiBCUMENggQe32CGOE241jKGaYY8FdpCn5BhRsIwXgihgnDI46EUMviMhZMBHFys8WxQWnCaurgSLUWZD+Tc5KII0nsDkZxoFWSrmxXQg818EnxmbNgDUTKV4Olcb8em8KT6V3mGCNYU5qIemcfhBcfgGWMOlb01MrZcX5IhQtY+7yWjBmoToKG0J7FKA0IseokM3CwiNVK5MpqWxtkav1eV1znHkMaUyaiywnBSMQN4X424NjBgXK4JE8gfVrJlWmSg-1kCiHWbcEN45tysjprYVV1FnAav3lDakzJFjMmZEYEoF8Oj0MlWsgA8qIQgkdBpFtfL7OtwYMrQlAptZc8x8jUSRECBkn48itpYu21ZSNuLyWQAOuKKxfjsq-FyqkllqhrGpBQ+EXh6RpqaeKmCqi1nrpQsgC1BN8VxQAnTOEDFvlaCZFsZcjMaRsl5PycxrQxVtolaujmD6bw5v1PmrNrYt0LQZqTYw-JnBu0BC8kuqgwx5CcZuRirQM1rrko+1QcG80FtoMhrISh3auG9DuJYOhGLkqRNXRYjpQKhkXNeiDt6vFkaQhuhqHZBJ0YUNlPD1DHS0u5AyP91Qv1HyrpOLQyJXGkc4rjKTb4fhHwjIxdQDTvgvOou8+E9gkT4RSrSdNN6XItPUSjWjlrX3WrDHYZKs53HpT8ByHIBQBW2EMMiYEyinMgMDpVJJ3NhpQH0x6VwSVfB+bSoKQL-7ERJUKAfUz7jwPLsg3epG7cEv6n4PVHE2pkv6ocEsWwLpNjGX-OYum+WG7wioasHTrmIE9P8iNcT-Fg0eeZVkWw4YPZFGedlQUgowT8inKRBKgJ9hlGKoJ5zoDEkaJqolobhoKtkHq7sL8axNAbHKHvCuGxq4QSAlXGzs5wL9f2259pmzMaCxYPpsyhl7agScL+1o9h7GUQ2K0XkJ8HbCmiww31NHvt8y1ljIWONvoA6bXhx5FNoSmepsuQMRleN8h5PMD7cWDvcy0ejv7EARbIP1hrYgcAAcn3Xmq1kTtYRLFdi4MtDM3AMwSgERHHbyttMgQ-NhBSX2TcpIUfIM53GFGAuYjj1TVqrCZJGqu22StCZc59wbrCn4cLQK-QmCck5JwB08go8x1fZVnJlfe25ucMlsJoStzhqc+NpxKC3MCDFW7t8nOMemJsKoQGZTczvmgrDd1r-ePIkoMkBDybwKwBPG927FoPX3Zdd0t+w-uiDryc9LUBTeHpgO73JV7mkqUkSOgLi0QPKPS-QKtzbt4XDMcx8V3H5EHpISmaONCBuixTO8r5UiGzRFgQ-ARztmLxri-m7l+Xl+EeP4sGZ3regVuAcWIcGGFLNmWiTnJfCGyvhVh5DWNRBu3fTu9-l7Ayv3C4jVFH2uWREKBpBDBFShmz2cHJXMzw3UzWF2nwnpUlygwGw2TR06TNgBzDHXhKXKF5wqU1T5XKEFRWkU30A-xlx5k2QwIMVqzvHxHPy+DpggkXQOjdBeRImrjk0ME3CcF0D9mQLK1aXi1R01hoO6WejO1j2uRnXIRs1KThCZB+BeV8GEVM15FSgSm9UEOE2EOD0VHp3EN2UyQiRGiwIYg9hIhMAbhh0RRJ0ZCSmREFDKF5GAlcAoJEIMI6UCW2RCT1H2UOWGVGXOWZSuXznwTphs31z8F-GUzwkMA-UYlh1yCDCN1BSPBHxMU81mCZGYKrg9AplhHMTu0QD5CSlpD8FyH+GsIvkCCAA */
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
                      profileClient: context.clients.profileClient,
                      lastEntityUpdate: context.lastEntityUpdate
                    }),
                    onDone: {
                      target: "Idle",
                      actions: ["updateVerseSceneEntities", "saveLastEntityUpdate"]
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
