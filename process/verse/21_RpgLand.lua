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
    Spawn = { 36, 46 },
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
      TxId = '9IBcxZrTOY59faXwk2RtRqIvTlUXFV32hB_Tf6qDI-g', -- TxId of the tilemap in TMJ format
      -- Since we are already setting the spawn in the middle, we don't need this
      -- Offset = { -10, -10 },
    },
  },
}

VerseEntitiesStatic = {}

--#endregion

return print("Loaded Verse Template")
