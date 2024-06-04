-- ProcessId: a1C-TCUNUKCaEup0BiCXNwcVWxOVOiRBfmKuBZwPWZg

-- Fixed
VerseInfo = {
  Parent = 'w0UvMR1XlVEjjNSaBn9F1qSkDPoIaWHJXzp5G5jjdAo', -- WeaveWorldProcessId
  Name = 'Origin Island',
  Dimensions = 2,
  ['Render-With'] = '2D-Tile-0',
}

-- Manually defined by the verse owner
VerseParameters = {
  ['2D-Tile-0'] = {
    Version = 0,
    -- Icon for verse that shows up on parents
    Icon = {
      Type = 'Fixed',
      Format = 'PNG',
      TxId = 'todo' -- TxId of a PNG
    },
    -- This is a tileset themed to the overworld of origin island
    Tileset = {
      Type = 'Fixed',
      Format = 'PNG',
      TxId = 'dPCX5xVVnVq9urytiRHlSR-fTQYQ3TIfEfl-qUtf3l4', -- TxId of the tileset in PNG format
    },
    -- This is a tilemap of origin island & building exteriors
    Tilemap = {
      Type = 'Fixed',
      Format = 'TMJ',
      TxId = '9Q7WlHm66GK0NFaW5VTXgo0iK0l3konGtEn7F_krwQI', -- TxId of the tilemap in TMJ format
      Offset = { -12, -12 },                                -- Offset for the tilemap
    },
  },
}

-- Registered Child verses
-- These can be warped to without any additional confirmation from the User
-- Warps to verses not in this list will require confirmation from the User
-- (The exception being the parent verse, which also can be freely warped to)
VerseRegistry = {
  -- LlamaFedProcessId
  ['_ghCCK1S0B2_vwO6yHBMwcCDTl6Hj6uXA0oyXwFOza4'] = {
    BypassParameters = true, -- Does not inherit `VerseParametersInherit`
  },
  ['SomeOtherProcessId'] = {
    -- BypassParameters = false, -- By default inherit `VerseParametersInherit`?
  },
}

-- These are the parameters that child verses inherits by default
-- This is in addition to any passed down from parent verses
VerseInherit = {
  Info = {
    -- This will limit the dimensions for children verse to 2
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
VerseEntities = {
  -- -- WeaveWorldProcess
  -- ['w0UvMR1XlVEjjNSaBn9F1qSkDPoIaWHJXzp5G5jjdAo'] = {
  --   Position = { -2, -2 },
  --   Type = 'Hidden', -- understood by `2D-Tile-0` renderer
  --   Interaction = {
  --     Type = 'Warp',
  --   },
  -- },
  -- LlamaFedProcess
  ['IN3T2l6QERA6d65XGW5asx2JWX7VrOQ3HIbwQvKVBQo'] = {
    Position = { 0, -6 },
    Type = 'Hidden', -- understood by `2D-Tile-0` renderer
    Interaction = {
      Type = 'Warp',
      Size = { 3, 1 }
    },
  },
  -- ['SomePlayerProcessId'] = {
  --   Position = { 0, 0 },
  --   Type = 'Avatar',
  -- },
  -- ['SomeBotProcessId'] = {
  --   Position = { 0, 0 },
  --   Type = 'Avatar',
  -- },
}

-- TODO: Purchasing buildings
