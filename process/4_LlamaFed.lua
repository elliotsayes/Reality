-- Fixed
VerseInfo = {
  Parent = 'OriginIslandProcessId',
  Name = 'Llama Fed',
  Dimensions = 2,
  ['Render-With'] = '2D-Tile-0',
}

-- Manually defined by the verse owner
VerseParameters = {
  ['2D-Tile-0'] = {
    Version = 0,
    -- This is the interior tileset enforced by origin island verse
    Tileset = {
      Type = 'Fixed',
      Format = 'PNG',
      TxId = 'todo', -- TxId of the tileset in PNG format
    },
    -- This will be a tilemap the interior of the llama fed
    Tilemap = {
      Type = 'Fixed',
      Format = 'TMJ',
      TxId = 'todo', -- TxId of the tilemap in TMJ format
    },
  },
}

-- Updated by player actions
VerseEntities = {
  ['OriginIslandProcessId'] = {
    Position = { 0, 0 },
    Type = 'Warp', -- 'Warp'/'Avatar' types are understood by `2D-Tile-0` renderer
  },
  ['SomePlayerProcessId'] = {
    Position = { 0, 0 },
    Type = 'Avatar',
  },
  ['SomeBotProcessId'] = {
    Position = { 0, 0 },
    Type = 'Avatar',
  },
  ['LlamaAssistantProcessId'] = {
    Position = { 0, 0 },
    Type = 'Avatar',
    Interaction = {
      Type = 'MessageApi',
      Id = 'Petition',
    },
  },
}
