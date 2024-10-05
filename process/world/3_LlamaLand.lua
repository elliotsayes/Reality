-- ProcessId: 9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss

-- Fixed
RealityInfo = {
  Parent = 'w0UvMR1XlVEjjNSaBn9F1qSkDPoIaWHJXzp5G5jjdAo', -- WeaveWorldProcessId
  Name = 'Llama Land',
  Dimensions = 2,
  ['Render-With'] = '2D-Tile-0',
}

-- Manually defined by the world owner
RealityParameters = {
  Token = {
    Primary = 'pazXumQI-HPH7iFGfTC-4_7biSnqz_U67oFAGry5zUY',
  },
  ['2D-Tile-0'] = {
    Version = 0,
    -- Icon for world that shows up on parents
    Icon = {
      Type = 'Fixed',
      Format = 'PNG',
      TxId = 'todo' -- TxId of a PNG
    },
    -- This is a tileset themed to the overworld of origin island
    Tileset = {
      Type = 'Fixed',
      Format = 'PNG',
      TxId = 'Z4_AJJuhKmmz2JP96nD69_AzDpc5oxi7-fCAnria-ks', -- TxId of the tileset in PNG format
    },
    -- This is a tilemap of origin island & building exteriors
    Tilemap = {
      Type = 'Fixed',
      Format = 'TMJ',
      TxId = 'ql_zdPUA8U6JHmiGAXM58ZW57-QuJTrgxa8lFttVc7g', -- TxId of the tilemap in TMJ format
      Offset = { -52, -32 },                                -- Offset for the tilemap
    },
  },
  -- Disable for now
  -- ['Audio-0'] = {
  --   Bgm = {
  --     Type = 'Fixed',
  --     Format = 'WEBM',
  --     TxId = 'k-p6enw-P81m-cwikH3HXFtYB762tnx2aiSSrW137d8', -- TxId of BGM
  --   },
  -- }
}

-- Registered Child worlds
-- These can be warped to without any additional confirmation from the User
-- Warps to worlds not in this list will require confirmation from the User
-- (The exception being the parent world, which also can be freely warped to)
RealityRegistry = {
  -- LlamaFedProcessId
  ['_ghCCK1S0B2_vwO6yHBMwcCDTl6Hj6uXA0oyXwFOza4'] = {
    BypassParameters = true, -- Does not inherit `RealityParametersInherit`
  },
  ['SomeOtherProcessId'] = {
    -- BypassParameters = false, -- By default inherit `RealityParametersInherit`?
  },
}

-- These are the parameters that child worlds inherits by default
-- This is in addition to any passed down from parent worlds
RealityInherit = {
  Info = {
    -- This will limit the dimensions for children world to 2
    Dimensions = 2,
    -- This will restrict the renderer to the same as Origin Island
    ['Render-With'] = '2D-Tile-0',
  },
  Parameters = {
    -- This will limit the range where entities can exist, and also player movement for the client
    Positions = {
      Lower = { -14, -10 },
      Upper = { 14, 10 },
    },
    ['2D-Tile-0'] = {
      Version = 0,
      -- This is a tileset themed to building **interiors** in origin island
      Tileset = {
        Type = 'Fixed',
        Format = 'PNG',
        TxId = 'gxNTOop1jamIJQzAvtSB4KgEVdh-eRi56taSgIFtVlM', -- TxId of the interiors tileset in PNG format
      },
    },
  },
}

-- Updated by player actions
RealityEntitiesStatic = {
  -- -- WeaveWorldProcess
  -- ['w0UvMR1XlVEjjNSaBn9F1qSkDPoIaWHJXzp5G5jjdAo'] = {
  --   Position = { -2, -2 },
  --   Type = 'Hidden', -- understood by `2D-Tile-0` renderer
  --   Interaction = {
  --     Type = 'Warp',
  --   },
  -- },
  -- LlamaFedProcess
  ['QIFgbqEmk5MyJy01wuINfcRP_erGNNbhqHRkAQjxKgg'] = {
    Position = { 0, -6 },
    Type = 'Hidden', -- understood by `2D-Tile-0` renderer
    Metadata = {
      Interaction = {
        Type = 'Warp',
        Size = { 3, 1 }
      },
    },
  },
  ['Bouncer2'] = {
    Position = { -5.8, -0.5 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = "Bouncer",
      SkinNumber = 9,
    },
  },
  ['Bouncer1'] = {
    Position = { -5.8, 0.5 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = "Bouncer",
      SkinNumber = 9,
    },
  },
  ['vtxDQx59thIrSrfN7Zn8AWDz0Vy496q360eVCCtN4Gs'] = {
    -- By LHS Boat
    Position = { -10, 15 },
    Metadata = {
      DisplayName = "Llama Dock",
      Interaction = {
        Type = 'Warp',
        Size = { 4, 2 },
        Position = { -1, -10 }
      },
    }
  },
  ['abyG0zg0RnguuedHwrjpxPkzc2qcXeX7Pfc2dyfypXw'] = {
    Position = { -2, 15.5 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Llama Sailor',
      SkinNumber = 2,
      Interaction = {
        Type = 'Default',
      },
    },
  },
  ['FdDJu16cgYE4KAT07jXtxvukntAE3JZaE3WrNnAjGis'] = {
    Type = "Avatar",
    Position = { 0, 12 },
    Metadata = {
      DisplayName = "Boatmaster",
      SkinNumber = 3,
      Interaction = {
        Type = 'SchemaExternalForm',
        Id = 'WarpVote',
      },
    },
  },
  ['CJcM_n0-s3gtt_Xqcffu5-AseTFARioG7iK4B3myeU4'] = {
    Type = "Avatar",
    Position = { 6, 14 },
    Metadata = {
      DisplayName = "Captain",
      SkinNumber = 9,
      Interaction = {
        Type = 'SchemaForm',
        Id = 'Sail',
      },
    },
  },
  ['KY0KVzY4scBfs04gj_cVOrnl0CBc0SNA_pzO9kGwYPc'] = {
    Type = "Avatar",
    Position = { -6, -6 },
    Metadata = {
      DisplayName = "Oracle Llama",
      SpriteTxId = "DI69VXAV5an_lsP3p8IpjYjhIw6ca0UpFG6OkoE7p1c",
      Interaction = {
        Type = 'SchemaExternalForm',
        Id = 'AskOracleLlama',
      },
    },
  },
  ['qT4jFIL_6a9AcFDhalFA3EITtZxfbchqaQQVp9e3PVM'] = {
    Position = { 4, 5 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = '0rbit Llama',
      SkinNumber = 3,
      Interaction = {
        Type = 'SchemaForm',
        Id = 'PriceFeedLlama'
      },
    },
  },
  ['zsU5NxCo8WbpyLCqXrckjmXfP0PWpAGzo1E-W_iegbI'] = {
    Position = { -4, 6 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = "LLama-Jack",
      SkinNumber = 9,
      Interaction = {
        Type = "SchemaExternalForm",
        Id = "BlackJack",
      }
    }
  },
  ['_bXCnR0M2ScWZa8oFr-PqsaV9CELacwkV9Nw9GGYY44'] = {
    Position = { -6, 4 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = "Cyberbeaver Envoy",
      SpriteTxId = "FHCT2xGXH6JjrBdzi7ZWH6XQLznvK8w_oDcGSMHKXbE",
      SpriteAtlasTxId = "YbVBjea-49kTdspM_EALm-OcxrQjQuBj56Vboujfuek",
      Interaction = {
        Type = "SchemaForm",
        Id = "PlayBeavers",
      }
    }
  }
}

-- TODO: Purchasing buildings

Handlers.add(
  "Info",
  Handlers.utils.hasMatchingTag("Action", "Info"),
  function(msg)
    return print("Welcome to LlamaLand! Go to LlamaLand.g8way.io to play.")
    -- Handlers.utils.reply("Welcome to LlamaLand! Go to LlamaLand.g8way.io to play.")(msg)
  end
)
