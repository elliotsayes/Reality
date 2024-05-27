-- ProcessId: a9kEYc1DdJRVMg-V8DuwKNgcfzACsLDQiHlCVfSu1e0

-- Fixed
VerseInfo = {
  Parent = 'jd2qig6cLYNiq1Nn_9sAuEax3sONMZA1u0oXzbh08Fw', -- OriginIslandProcessId
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
      TxId = 'gxNTOop1jamIJQzAvtSB4KgEVdh-eRi56taSgIFtVlM', -- TxId of the tileset in PNG format
    },
    -- This will be a tilemap the interior of the llama fed
    Tilemap = {
      Type = 'Fixed',
      Format = 'TMJ',
      TxId = 'U2TkWnv6ZOkMt8HcPW3GRZLTIm1LFA7tc67y9t3OpCc', -- TxId of the tilemap in TMJ format
    },
  },
}

-- Updated by player actions
VerseEntities = {
  -- OriginIslandProcess
  ['jd2qig6cLYNiq1Nn_9sAuEax3sONMZA1u0oXzbh08Fw'] = {
    Position = { 0, 0 },
    Type = 'Warp', -- 'Warp'/'Avatar' types are understood by `2D-Tile-0` renderer
  },
  -- LlamaAssistantProcess
  ['8_jPBME4fI3mDXSYriPcb3RfvyQxCHWe6meEh5KJdDw'] = {
    Position = { 0, 0 },
    Type = 'Avatar',
    Interaction = {
      Type = 'MessageApi',
      Id = 'Petition',
    },
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
