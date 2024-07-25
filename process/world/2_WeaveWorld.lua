-- ProcessId: lNgVEhChWcW4OMoISEcTI06eWbNuzRypB3KAK_8f7NU

-- Fixed
RealityInfo = {
  Parent = '-wNWBTJSU9c8RqID5J3GZy074Rt9PEZbVmv383Mz6nQ',
  Name = 'WeaveWorld',
  Dimensions = 2,
  ['Render-With'] = '2D-Tile-0',
}

-- Manually defined by the world owner
RealityParameters = {
  ['2D-Tile-0'] = {
    Version = 0,
    -- This will be a tileset themed with a sea & islands
    Tileset = {
      Type = 'Fixed',
      Format = 'PNG',
      TxId = 'todo', -- TxId of the tileset in PNG format
    },
    -- This will be a tilemap of an infinite sea with islands dotted
    Tilemap = {
      Type = 'Composite',
      Parts = {
        -- This will be a static tilemap of the origin area
        {
          Type = 'Fixed',
          Format = 'TMJ',
          TxId = 'todo',
        },
        -- To make this infinite, we will have to do something custom... like this?
        {
          Type = 'Fixed',
          Format = 'TMJ',
          TxId = 'todo',
          Parameters = {
            Repeat = true,
          },
        },
      },
    },
  }
}

-- Player entities can be updated by player actions, i.e. movement
RealityEntitiesStatic = {
  -- OriginIslandProcess
  ['--5ozI7qKmLyBxcZJr_T62iGltnKE2ei1jOoQrKKfRA'] = {
    Position = { 2, 2 },
    Type = 'Hidden', -- These types are understood by the `2D-Tile-0` renderer
    Metadata = {
      Interaction = {
        Type = 'Warp',
      },
    }
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

-- TODO: Purchasing land
