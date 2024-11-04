-- Name: detective_world
-- ProcessId: LryOv-VD-3m-lpJDhmu6x1Fj09CwVvx-ETvMe4jZvbw

--#region Model

RealityInfo = {
  Dimensions = 2,
  Name = 'ExampleReality',
  ['Render-With'] = '2D-Tile-0',
}
-- Primary: z.optional(ArweaveId),
-- SchemaForm: z.optional(
--   z.object({
--     Target: z.string(),
--     Id: z.string(),
--   }),
-- ),
RealityParameters = {
  Token = {
    Primary = 'pazXumQI-HPH7iFGfTC-4_7biSnqz_U67oFAGry5zUY',
    SchemaForm = {
      Target = '1FqYv_U-33tvg_4gwt6SeMlIqOa7KMEaXK6mvogMBss',
      Id = 'Leaderboard',
    }
  },
  ['2D-Tile-0'] = {
    Version = 0,
    Spawn = {
      228,
      200
    },
    -- This is a tileset themed to Llama Land main island
    Tileset = {
      Type = 'Fixed',
      Format = 'PNG',
      TxId = 'gUbLnKkziBqp-3xoBr-cyUXKQddIQPk60PMi36acaTo', -- TxId of the tileset in PNG format
      -- OyQ72C2RuU5T3wIj5ON9dThx2Nyhwa2yOsoCCBOHjlE
    },
    -- This is a tilemap of sample small island
    Tilemap = {
      Type = 'Fixed',
      Format = 'TMJ',
      TxId = 'tsENAgUvIn5o5npE7oSBCE1LLMuqSEemJZe6Y61zCCc', -- TxId of the tilemap in TMJ format
      -- 5e_xEgSx-HTDWfgIm832bPWA96N2WVyrVkb3ubdndSU
      -- OIrcot4DJ_qVgDIdLNP7jKIzyk1mwyWlbN7TFdvqh5w
      -- Since we are already setting the spawn in the middle, we don't need this
      -- Offset = { -10, -10 },
    },
  },
}
RealityEntitiesStatic = {
  ['PrizeLlama'] = {
    Position = { 222, 194 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Prize Llama',
      SkinNumber = 1,
      Interaction = {
        Target = "1FqYv_U-33tvg_4gwt6SeMlIqOa7KMEaXK6mvogMBss",
        Type = 'SchemaForm',
        Id = "PrizeLlama"
      },
    },
  },
  ['GuideLlama'] = {
    Position = { 228, 195 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Guide Llama',
      SkinNumber = 8,
      Interaction = {
        Target = "sotxMLNR92QNc3zR5UI_llr8Hgen_wpuPhlcp9HCr4E",
        Type = 'SchemaForm',
        Id = "Guide"
      },
    },
  },
  ['WarperLeftShop'] = {
    Position = { 187, 197 },
    Type = 'Hidden',
    Metadata = {
      Interaction = {
        DisplayName = 'Back To Dock',
        Type = 'Warp',
        Size = { 0.5, 0.5 },
        Position = { 21, 126 },
        Target = "LryOv-VD-3m-lpJDhmu6x1Fj09CwVvx-ETvMe4jZvbw",
      },
    },
  },
  ['WarperLeftShop2'] = {
    Position = { 21, 129 },
    Type = 'Hidden',
    Metadata = {
      Interaction = {
        DisplayName = 'Back To Dock',
        Type = 'Warp',
        Size = { 0.5, 0.5 },
        Position = { 187, 198 },
        Target = "LryOv-VD-3m-lpJDhmu6x1Fj09CwVvx-ETvMe4jZvbw",
      },
    },
  },
  ['qJqiQUzc05T90OF9B12dfoxoxZcMoYTwlgrIg2x2GpQ'] = {
    Position = { 21, 121 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Scarlett',
      SkinNumber = 2,
      Interaction = {
        Type = 'SchemaForm',
        Id = "Scarlett"
      },
    },
  },
  ['WarperRightShop'] = {
    Position = { 280, 197 },
    Type = 'Hidden',
    Metadata = {
      Interaction = {
        DisplayName = 'Back To Dock',
        Type = 'Warp',
        Size = { 0.5, 0.5 },
        Position = { 13, 393 },
        Target = "LryOv-VD-3m-lpJDhmu6x1Fj09CwVvx-ETvMe4jZvbw",
      },
    },
  },
  ['WarperRightShop2'] = {
    Position = { 13, 396 },
    Type = 'Hidden',
    Metadata = {
      Interaction = {
        DisplayName = 'Back To Dock',
        Type = 'Warp',
        Size = { 0.5, 0.5 },
        Position = { 280, 198 },
        Target = "LryOv-VD-3m-lpJDhmu6x1Fj09CwVvx-ETvMe4jZvbw",
      },
    },
  },
  ['E-OMoWkWNWsmIl5dItrWv6giDCj9eO7imsNODKzHlnI'] = {
    Position = { 11, 392 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'William',
      SkinNumber = 2,
      Interaction = {
        Type = 'SchemaForm',
        Id = "William"
      },
    },
  },
  ['WarperUpRightShop'] = {
    Position = { 256, 144 },
    Type = 'Hidden',
    Metadata = {
      Interaction = {
        DisplayName = 'Back To Dock',
        Type = 'Warp',
        Size = { 0.5, 0.5 },
        Target = "Fg-xkUDpCRDruNDX8_1cnwmeWw1MRRStsvuKCWIw3p0",
      },
    },
  },
  ['WarperUpHouse'] = {
    Position = { 228, 176 },
    Type = 'Hidden',
    Metadata = {
      Interaction = {
        DisplayName = 'Back To Dock',
        Type = 'Warp',
        Size = { 0.5, 0.5 },
        Position = { 18, 26 },
        Target = "LryOv-VD-3m-lpJDhmu6x1Fj09CwVvx-ETvMe4jZvbw",
      },
    },
  },
  ['WarperUpHouse2'] = {
    Position = { 18, 29 },
    Type = 'Hidden',
    Metadata = {
      Interaction = {
        DisplayName = 'Back To Dock',
        Type = 'Warp',
        Size = { 0.5, 0.5 },
        Position = { 228, 177 },
        Target = "LryOv-VD-3m-lpJDhmu6x1Fj09CwVvx-ETvMe4jZvbw",
      },
    },
  },
  ['C_sANK4K6T-sstd9V-6PIlkeAbIN1RaIDjOzC08QANQ'] = {
    Position = { 16, 16 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Ethan',
      SkinNumber = 2,
      Interaction = {
        Type = 'SchemaForm',
        Id = "Ethan"
      },
    },
  },
  ['WarperUpLeftHouse'] = {
    Position = { 174, 181 },
    Type = 'Hidden',
    Metadata = {
      Interaction = {
        DisplayName = 'Back To Dock',
        Type = 'Warp',
        Size = { 0.5, 0.5 },
        Position = { 382, 396 },
        Target = "LryOv-VD-3m-lpJDhmu6x1Fj09CwVvx-ETvMe4jZvbw",
      },
    },
  },
  ['WarperUpLeftHouse2'] = {
    Position = { 385, 396 },
    Type = 'Hidden',
    Metadata = {
      Interaction = {
        DisplayName = 'Back To Dock',
        Type = 'Warp',
        Size = { 0.5, 0.5 },
        Position = { 174, 182 },
        Target = "LryOv-VD-3m-lpJDhmu6x1Fj09CwVvx-ETvMe4jZvbw",
      },
    },
  },
  ['l2glftJa-_ZXJQF4NY89pf2nWManGnxeKyDvWUusm04'] = {
    Position = { 386, 389 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Olivia',
      SkinNumber = 2,
      Interaction = {
        Type = 'SchemaForm',
        Id = "Olivia"
      },
    },
  },
  ['WarperDownRightHouse'] = {
    Position = { 260, 223 },
    Type = 'Hidden',
    Metadata = {
      Interaction = {
        DisplayName = 'Back To Dock',
        Type = 'Warp',
        Size = { 0.5, 0.5 },
        Position = { 367, 26 },
        Target = "LryOv-VD-3m-lpJDhmu6x1Fj09CwVvx-ETvMe4jZvbw",
      },
    },
  },
  ['WarperDownRightHouse2'] = {
    Position = { 367, 29 },
    Type = 'Hidden',
    Metadata = {
      Interaction = {
        DisplayName = 'Back To Dock',
        Type = 'Warp',
        Size = { 0.5, 0.5 },
        Position = { 260, 224 },
        Target = "LryOv-VD-3m-lpJDhmu6x1Fj09CwVvx-ETvMe4jZvbw",
      },
    },
  },
  ['lO8SUxX70Ej5LZBDrhw8IAvye3P1EORvsntcM1WtlXg'] = {
    Position = { 368, 20 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Noah',
      SkinNumber = 2,
      Interaction = {
        Type = 'SchemaForm',
        Id = "Noah"
      },
    },
  },
  ['KJ4nGnhw_lGmg3LTXWWIYOA-M4z6qM2s_pmK_6ZvKuQ'] = {
    Position = { 255, 189 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Samuel',
      SkinNumber = 2,
      Interaction = {
        Type = 'SchemaForm',
        Id = "Samuel"
      },
    },
  },
  ['BzzKqx_fGazL66Xjwk1L6JT8h-PXRK0v98ZET5iOpto'] = {
    Position = { 126, 190 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Daniel',
      SkinNumber = 2,
      Interaction = {
        Type = 'SchemaForm',
        Id = "Daniel"
      },
    },
  },
  ['1HyqjY6DMvl5Nw7vt9SkA-1akasUyZXJuA4ikje4yVQ'] = {
    Position = { 185, 224 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Lily',
      SkinNumber = 2,
      Interaction = {
        Type = 'SchemaForm',
        Id = "Lily"
      },
    },
  },
  ['ISINc-hdPYah6S1dTlWkxDItiKWJmevbpUQoJyoYDQg'] = {
    Position = { 163, 181 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'James',
      SkinNumber = 2,
      Interaction = {
        Type = 'SchemaForm',
        Id = "James"
      },
    },
  },
  ['rdNqMF3N4-EpdEjPayYoHxQIoRWfAVhX_Ac53xxw7wA'] = {
    Position = { 236, 215 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Lucas',
      SkinNumber = 2,
      Interaction = {
        Type = 'SchemaForm',
        Id = "Lucas"
      },
    },
  },
  ['RkDfC9hczrepVI2o8Ot9Q9FMXnw4-7xzX1IbgBgFb2Q'] = {
    Position = { 262, 202 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Chester',
      SkinNumber = 2,
      Interaction = {
        Type = 'SchemaForm',
        Id = "Chester"
      },
    },
  },
  ['cOgWQPOSgaJTqLrLboIxIz7phuzylKrkH662iId6KUM'] = {
    Position = { 194, 202 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Sophia',
      SkinNumber = 2,
      Interaction = {
        Type = 'SchemaForm',
        Id = "Sophia"
      },
    },
  },
  ['nczcFnKx7m86pGTp8c7UYV21H_bJrlmOPM-cGSasTU8'] = {
    Position = { 202, 149 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Emma',
      SkinNumber = 2,
      Interaction = {
        Type = 'SchemaForm',
        Id = "Emma"
      },
    },
  },
  ['SwBpdVTlqmTZVDh2Nx0d4rkeY3EA7qZW08lQUcN_PUM'] = {
    Position = { 262, 181 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Oliver',
      SkinNumber = 2,
      Interaction = {
        Type = 'SchemaForm',
        Id = "Oliver"
      },
    },
  },
}
--#endregion

return print("Loaded Reality Template")
