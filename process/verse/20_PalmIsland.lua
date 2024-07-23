-- Name: PalmIsland
-- ProcessId: OqvzTvpHYrfswvVZdsSldVTNBnyBOk7kZf-oqDdvUjg

--#region Model

VerseInfo = {
  Dimensions = 2,
  Name = 'PalmIsland',
  ['Render-With'] = '2D-Tile-0',
}

VerseParameters = {
  ['2D-Tile-0'] = {
    Version = 0,
    Spawn = { 45, 47 },
    -- This is a tileset themed to Llama Land main island
    Tileset = {
      Type = 'Fixed',
      Format = 'PNG',
      TxId = 'h5Bo-Th9DWeYytRK156RctbPceREK53eFzwTiKi0pnE', -- TxId of the tileset in PNG format
    },
    -- This is a tilemap of sample small island
    Tilemap = {
      Type = 'Fixed',
      Format = 'TMJ',
      TxId = 'pLYUQOpqADXct_bvQDoIZMaud-7ZNCmWpy6ARAxvbR8', -- TxId of the tilemap in TMJ format
      -- Since we are already setting the spawn in the middle, we don't need this
      -- Offset = { -10, -10 },
    },
  },
}

VerseEntitiesStatic = {
  ['RgIs2u58lV3032gWhytemDNF2NmwZGKWQ0ClB0mqaK0'] = {
    Position = { 45, 49 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Confused Llama',
      SkinNumber = 2,
      Interaction = {
        Type = 'Default',
      },
    },
  },
  ['9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss'] = {
    Position = { 55.5, 48 },
    Type = 'Hidden',
    Metadata = {
      Interaction = {
        Type = 'Warp',
        Size = { 0.5, 1 }
      },
    }
  }
}

--#endregion

return print("Loaded Verse Template")
