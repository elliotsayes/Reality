import { ProfileClient } from '@/features/profile/contract/profileClient';
import { VerseClient, VerseClientForProcess } from '@/features/verse/contract/verseClient';
import { setup, assign, assertEvent, fromPromise } from 'xstate';
import { Preloader } from '../lib/phaser/scenes/Preloader';
import { MainMenu } from '../lib/phaser/scenes/MainMenu';
import { VerseScene } from '../lib/phaser/scenes/VerseScene';
import { listenScene, listenSceneEvent } from '../lib/EventBus';
import { loadVersePhaser } from '../lib/load/verse';
import { AoContractClientForProcess } from '@/features/ao/lib/aoContractClient';
import { ChatClient, ChatClientForProcess } from '@/features/chat/contract/chatClient';

export const renderMachine = setup({
  types: {
    input: {} as {
      playerAddress: string,
      initialVerseId?: string,
      clients: {
        aoContractClientForProcess: AoContractClientForProcess,
        profileClient: ProfileClient,
        verseClientForProcess: VerseClientForProcess,
        chatClientForProcess: ChatClientForProcess,
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
        chatClientForProcess: ChatClientForProcess,
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

      chatMessageOffset?: number,
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
      context.typedScenes.verseScene!.mergeEntities(entities, profiles);
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
    loadChatMessageCount: fromPromise(async ({ input }: {
        input: {
          chatClient: ChatClient
        }
      }) => {
        return await input.chatClient.readCount();
      },
    ),
    loadChatMessagesSinceOffset: fromPromise(async ({ input }: {
        input: {
          chatClient: ChatClient,
          offset: number
        }
      }) => {
        return await input.chatClient.readHistory({
          idAfter: input.offset
        });
      },
    ),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCcwDsJmQWQIYGMALASzTAGIBlfdMAAgCUxcIBPAbQAYBdRUABwD2sYgBdigtHxAAPRAFYAnAEYAdAA51igEy752gMyL5WgDQhWiALTL1qgGzqDB+-ZcAWAOxL7n9QF9-c1QMLDwiUgpqWkZmNnZlXiQQIRFxSWk5BGVtRU9VThU85WNteUd3c0sEGztHZ1cPb0V7HUDg9EwcAhIyKhoyWJYObSSBYTEJKWSs3QN85WV7eU53Q04lRSrrWwcnFzd7Lx8j9pAQrvDeqIH6JmH2AzGUifTp0CyDd2VODVyj7SeFRzTzbbIGVQHTyudzueTzdycbT2M4XMI9SKqACSaEmuAANuQuM9UpMMjNEIDFKp5O5NJ4DOptIVFFp5GDAfl7IDOEZ1Kt5AyDKjOuiImRsWg6ABxXAAWzAkroeFIyvQAFdJXjCQB1XDIfh0LFyhUQYi4URgYnSUlvTKIZSIiGcHKcTTKPw-TygiyIbkQtyLRSKNaeZQmbQi0LdcWKnEy+VxqUq5Ma1QAGUELDoADUsLAKBBJIrSAA3QQAa0VaJj1yVsoVSpTarQmsz2bzyALCDLgnwFqmxOtyVtU3t2UR8khvM8ZVn7iO7N9CHU0MhR0U82U8zys6jlwxEvjDaTdAACqh8VmulrxASiTwba8xxSELS6stt679ECDGCjr8BicAynhIjo2iIoo+5inWx6JkqF5gFeLBYLe5qEgkJLPuSHyIOo3IaGsjjyNu9JHP+sIOAYOSuMis6eO4UFBOcoq1picGNvGiHITe7YQLm+aFsWqi9lWqg1lc7FSieCGXteqF8QJXZgD2aDlv2bxDo+I7Ye8sh+i6NL6HS+jaDkdJ-suq52PCO7LECKiOtBbFHtJ8Hxp2BZ0NEEp6gapBQGh95+YaxqmualrDuMaQvrh2TqI6qgtN6ZTGN43rqP+ii-NlsIqMBKiaJGzESYep4yR5gnebcqghQFGbXkpBbkEWEqidWrGSa5CacVKnn0D5ip1WggWKf1qnqQOkhaVhMU4fp8VlDSLh5M4OgqCRYLgQUgLhmZDFGGUzldeV7l9VVg2qAAomg4iiKwdAACKCAA7mgPHYhA+IUDIsCiBaiq4AAZpayAABQ-JwnAAJTkKVsb1mdTUDTVN13Q9z1vR9WJfVa2nRWSemzIy+TImZQG+BUmj-poqjfOo5SMiYtjHWViO9cj1W0Ndt1iBjr3vdeqgAKr8BAAN0GjkxwC1wnteJnVsxxp79VzEpS-dT0Cx9ovi5aku8+IcATX2U1oDNT5zUTlKOtSRjzG6jL-C0YLeO4qg-EsZRe18C6swjytKqrl1nviuCsFg566aoZ66XQACK6pgEnn3feQusS7HVtRS8VvjrohlwkUQJuAyS7VNuBjaDS3wenO8j6Ky-uwW5HPBzVofh5HWeEzHcei9juPkEwUDEH9yBm3QADCkhA8QyCmjno7zbMtL2NOwFhqBjJAZUy45MGBSOu4FMFaBKIlYrAetyrF0d2HEfIFHVt91bdAD0LGf6z3byy21amVg6tGE67Nb7KTVoqTuj9n69x-lMd+-AdZi0zrpE2GlBw8CXrpfOtI7bQlKFoVYXxy4OlpGoN0rJcicHqKcS+wClY3yDnfbmUDu7RzgZIBBH17hsAfLNQm+cnDuzdHCFY1F8JfB9BXJ0kISIMy8FXc+7hm5SR6mAryl0NYPRHmPUQE83hBQwvjXOAjXzaCcOvBECVCq6G0GCQU68WiOiRAYFYSgTAqO6hVc64DNGG20WAUe48zaqB0X9LAAU-4lgAWJeGLc1FMN8ajfxsQgl6JCWE0GAU0FmwtjpPOZjoTu0bmUVoTgdDKFdnSDQs4SgmW+LoTwnjTpt2YerFJmT9FTFqrgSYI06BA0EE-fAs9iByjNuQX6-1LSqGBqDCGUMYZwyvvE7xnM-Ho1Sborpkgel9KgAMoZdARloDnuMzSxjl7WwQLvOwCUBTckdOUEhCA-Du3DHScxDd5hGCYh0eh18EmVSSdzKehALR0AVLAWAuAYCwEMXwy2pi4rOCUDSfkwY8iuEyvvZk7tYQujdF8hcbpmmgMSRomqYKIVQphXC1Q0owCiEhXAOl9ARnqlulEkSMSgEHkBWs9uoLwXMtpbCuADKmUsuheK45ghOWiByRc7gWCCkosBHYMyGwKkLlWpZCuRgpx6CcGyWknoyWB2BZS4VNLWXivhTjNOUyAazJBlgBZUNYZxNUYKtpipqWirtfSx1eN+F2lfF8JkBRBSMgXICE+4YwThnmKoBidTd4MVAgEOh-LVlIyFRKAN0q2XwrBWAfAFY6BkBesW+13L5beq8fmv1qgi1ivpWWitVawA1vbcbXs6DpqYMudgiNRwITqG+K0QwLQ2T6odG4KcRxER7TWJuVwgRmJoEEJgeAyRG1gCReGuKuhqSbChvCEMQIShghsH4DQ4iq6uJaC0NYFrcR3nxEe2KC1OQ0mDBeowXgihJvKElaEUMviMhZMBd9ajv0r0QHCaurgSLUWZD+TcSalrxtqciQUhgjBwbWc2bAGoEPXO3CsOmtgr0JucPMMEawl1KERF4b0YZGLKJzTBH1SNSNphxNqCj45j7vJfdladUNoT2LRQlJYThIZuFhMR-jvTUytgah2QSInXzOPIY0pk1FlhOCkYgbwvxtzapDK4ewSJ5CqY5gJzTlB-rIGZQWw9+TkULW3KyGjWgvD0ecGZ7IUNqTMkWMyZkRgSgX3+bmvjHMADyohCCR0GrplFeVVC5F3KuXwGxKnLnmPkaiSIgQMk-Fixzp5uLyWQFlhaKxfioa-Bhqk86EBrrpluQUk7DisiaTxlyLS6tyRQsgQxTWsgATpnCBi3ytBMi2MuRm6LjC8n5OY1oyhauySQg11Qrn9TMuc+qGbeFBS5eMPyELtJAQvJLqmkoJcShfBfftriE2bwnfc+s24l23whgcL4ECKhp2MSTUiauixHSgVDIuYbCXeNNo5vVybWn+L9SB0oX459HTQe5AyVb1RFtHyrpOLQyJXFfdxrjn4R8IyMUneZRNJXErJrsztlKtIHMjZAZanx1qyBA49LsZKs53HpT8ByHI-7oR2daN4T8X3hco25sNKAYvFdJTB6lQUgpZdre+AUfC6wwKOHDGrgHmv9T8HqkJz9Yv8Lu3sEsWwLpNjGX-OYumhRwzfKoasG3nmen+RGlj5GLvwweyKM87KhvQv8inKRBKGrnBlGKij0b5KrUa98vb+qIVbei+88e3zCU7BfjWJoDY5Q94Vw2NXCCQEq52dnOBUPLatFayxteIHWq1D2yzU7F99h7GUUMLXSdQI6R0m7yC9pmzMaCxYKnLzBMK+zBi6mx5FNoSTupsuQMRkEd8h5PMRfIvFS99X0gvW9ANbEDgIPk+68E2sidrCJYrsXABcZgZir2vwL0gQfjYTVRMW30pEKHyBnHcUKGAnMWh0YkhH5BKAU3Y10BAIgRjnAKfg4TQFfkJgTiTiTkHyeQKHmAQOylnBxQrm3HXiZDdCUEWEzSWBwJDnwJgQMUINIOTjjHp3Lx-VmHeyoOaBWFoOQNxVAnA0UR5G8BWGRxYgBTzVaSXzAK7gIPYX7kQQH2EMQwQAgn8yAk3g9C213iTUYNTV5DYNsAchyE4Pvi0J4O6T4I-nXxDUH3dzKwGy8GWBIlsEbwdF0GEWRFWGRGBB+GFAFwYSBXV1wNYW0JfncL0PXy-noEIMHwsQcDDA9FcEKAAheWTRskK0YgYkMEDycJYW4MIOILeC4SFh4WqC3xEMpDszPRDFZH5Aq0IyTW+CnAZAgjWF2nwlg1iIFWbQ0J5k2U6TNkHzDHXhKXKC-wqSYwglTR3jT0WWeWqOXz5i2WCQMSd3QmyK+DpmMOhAOhYPsXl2oRyHticFCPixUMSzR3UVAJmIOLmIMWejL1aMMPK3IW5wbwjB+BeV8GEUnV5FSgShUwmLUI+NwN7x+O6UyQiRGgWIYg9hIhMAblaBdFJz9EZCSnwyl15GAg3QRKSyRI2W+MCW2RCT1H2UOWGVGXOR-SuXznwTpjsyZGsl-CJJXEMHm0Yl5DXSDGz1eNRzGwpU+LbSDVfwMOuSriWEhEYmDDhCrgggn33moV+DpAZk3BKGRCiz2P9RFVrWDQ-VOOVPHFRS5GomPjkTKAbisK8A0EWGOB5Gyk3HNNbUtL7XhUZUDRlRgDlQVSB3b3dg+01PhGeOw28HRR+CeN3BaBiJz0F0YXz1wIVLDIlS8LtIjRcGrlEUNQOholC2TXyEgh0BPgaEe39LzJLQDPLUrWrStKVIBJVO5GpFZC9ASig2kIrjQySmMA9GW2MFxItSEO7MEVLMMH2gplhHMWCJuX82MC8BW3+DxIvkCCAA */
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
            },

            "Chat messages": {
              states: {
                Initial: {
                  always: "Get message count"
                },

                "Get message count": {
                  invoke: {
                    src: "loadChatMessageCount",
                    input: ({ context }) => ({
                      chatClient: context.clients.chatClientForProcess(context.currentVerseId!)
                    }),
                    onDone: {
                      target: "Idle",
                      actions: "assignChatMessageOffset"
                    }
                  }
                },

                Idle: {
                  after: {
                    "1000": "Check new messages"
                  }
                },

                "Check new messages": {
                  invoke: {
                    src: "loadChatMessagesSinceOffset",
                    input: ({ context }) => ({
                      chatClient: context.clients.chatClientForProcess(context.currentVerseId!),
                      offset: context.chatMessageOffset!,
                    }),
                    onDone: {
                      target: "Idle",
                      actions: ["updateChatMessageOffset", "notifyRendererOfNewMessages"],
                      reenter: true
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
