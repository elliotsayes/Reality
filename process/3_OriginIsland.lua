-- Fixed
WorldInfo = {
  Parent = 'WeaveWorldProcessId',
  Name = 'Origin Island',
  Dimensions = 2,
  ['Render-With'] = '2D-Tile-0',
}

-- Manually defined by the world owner
WorldParameters = {
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
      TxId = 'todo', -- TxId of the tileset in PNG format
    },
    -- This is a tilemap of origin island & building exteriors
    Tilemap = {
      Type = 'Fixed',
      Format = 'TMJ',
      TxId = 'todo', -- TxId of the tilemap in TMJ format
    },
  },
}

-- Registered Child worlds
-- These can be warped to without any additional confirmation from the User
-- Warps to worlds not in this list will require confirmation from the User
-- (The exception being the parent world, which also can be freely warped to)
WorldRegistry = {
  ['LlamaFedProcessId'] = {
    BypassParameters = true, -- Does not inherit `WorldParametersInherit`
  },
  ['SomeOtherProcessId'] = {
    -- BypassParameters = false, -- By default inherit `WorldParametersInherit`?
  },
}

-- These are the parameters that child worlds inherits by default
-- This is in addition to any passed down from parent worlds
WorldInherit = {
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
        TxId = 'todo', -- TxId of the interiors tileset in PNG format
      },
    },
  },
}

-- Updated by player actions
WorldEntities = {
  ['WeaveWorldProcessId'] = {
    Position = { 0, 0 },
    Type = 'Warp', -- understood by `2D-Tile-0` renderer
  },
  ['SomePlayerProcessId'] = {
    Position = { 0, 0 },
    Type = 'Avatar',
  },
  ['SomeBotProcessId'] = {
    Position = { 0, 0 },
    Type = 'Avatar',
  },
}

-- TODO: Purchasing buildings
