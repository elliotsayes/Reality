-- ProcessId: BSs3O9QCfi61LihXOBQn8I3uyS_bsoFHa8cccBmfuYY

-- Fixed
VerseInfo = {
  Parent = '3RJ-bOltNmn5r4VR3OmZAPAaoLGYCD7HA7cUoDWPt-4',
  Name = 'WeaveWorld',
  Dimensions = 2,
  ['Render-With'] = '2D-Tile-0',
}

-- Manually defined by the verse owner
VerseParameters = {
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
VerseEntities = {
  -- OriginIslandProcess
  ['jd2qig6cLYNiq1Nn_9sAuEax3sONMZA1u0oXzbh08Fw'] = {
    Position = { 0, 0 },
    Type = 'Warp', -- These types are understood by the `2D-Tile-0` renderer
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
