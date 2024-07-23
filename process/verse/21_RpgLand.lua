-- Name: RpgLand
-- ProcessId: ZeDtHnbKThvHxN5NIudNRqtIlTle7KyGLQeiQTP1f_E

--#region Model

VerseInfo = {
  Dimensions = 2,
  Name = 'RpgLand',
  ['Render-With'] = '2D-Tile-0',
}

VerseParameters = {
  ['2D-Tile-0'] = {
    Version = 0,
    Spawn = { 36, 47 },
    -- This is a tileset themed to Llama Land main island
    Tileset = {
      Type = 'Fixed',
      Format = 'PNG',
      TxId = 'xrOESiASoUY6raY42JlULO44jY-MYzb92SuYXSbP8L0', -- TxId of the tileset in PNG format
    },
    -- This is a tilemap of sample small island
    Tilemap = {
      Type = 'Fixed',
      Format = 'TMJ',
      TxId = 'TmVIwkR97Vo2JmeAD34o_PqLUc7UUIiJ2G0pb7uk5yo', -- TxId of the tilemap in TMJ format
      -- Since we are already setting the spawn in the middle, we don't need this
      -- Offset = { -10, -10 },
    },
  },
}

VerseEntitiesStatic = {
  -- Blue potion: Warp back to Llama land
  ['9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss'] = {
    Position = { 51, 57 },
    Type = 'Hidden', -- 'Warp'/'Avatar' types are understood by `2D-Tile-0` renderer
    Metadata = {
      Interaction = {
        Type = 'Warp',
        Size = { 1, 1 }
      },
    }
  },
  -- TOOD: Red potion
  -- ['9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss'] = {
  --   Position = { 48, 57 },
  --   Type = 'Hidden', -- 'Warp'/'Avatar' types are understood by `2D-Tile-0` renderer
  --   Metadata = {
  --     Interaction = {
  --       Type = 'Warp',
  --       Size = { 1, 1 }
  --     },
  --   }
  -- },
  ['D5r-wBDfgo_Cx52uYoI8YiHp7QTqvpPbL8TtcbCoaXk'] = {
    Position = { 65.5, 51.5 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Llama Giver',
      SkinNumber = 2,
      Interaction = {
        Type = 'SchemaForm',
        Id = 'GetDonation',
      },
    },
  }
}

--#endregion

return print("Loaded Verse Template")
