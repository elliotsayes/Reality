-- ProcessId: QIFgbqEmk5MyJy01wuINfcRP_erGNNbhqHRkAQjxKgg

-- Fixed
VerseInfo = {
  Parent = '9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss', -- OriginIslandProcessId
  Name = 'Llama Fed',
  Dimensions = 2,
  ['Render-With'] = '2D-Tile-0',
}

-- Manually defined by the verse owner
VerseParameters = {
  ['2D-Tile-0'] = {
    Version = 0,
    Spawn = { 16, 19 },
    -- This is the interior tileset enforced by origin island verse
    Tileset = {
      Type = 'Fixed',
      Format = 'PNG',
      TxId = 'M4ztlWptdamLxlUVYwnDgfu2AcweUnHWonL3ikiErv0', -- TxId of the tileset in PNG format
    },
    -- This will be a tilemap the interior of the llama fed
    Tilemap = {
      Type = 'Fixed',
      Format = 'TMJ',
      TxId = '5BInm1jnwj__yuCRo1kebIGmhKPVsEOjrzC87P1w5v0', -- TxId of the tilemap in TMJ format
    },
  },
}

-- Updated by player actions
VerseEntitiesStatic = {
  -- OriginIslandProcess
  ['9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss'] = {
    Position = { 16, 21 },
    Type = 'Hidden', -- 'Warp'/'Avatar' types are understood by `2D-Tile-0` renderer
    Interaction = {
      Type = 'Warp',
      Size = { 3, 1 }
    },
  },
  -- LlamaAssistantProcess
  ['y_obnQk5mkphKlulM7v1Xyn6IhJKZGhP_BC1qLJq46w'] = {
    Position = { 16, 3.5 },
    Type = 'Avatar',
    Interaction = {
      Type = 'SchemaExternalForm',
      Id = 'Petition',
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
