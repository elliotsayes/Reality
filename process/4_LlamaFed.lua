-- ProcessId: _ghCCK1S0B2_vwO6yHBMwcCDTl6Hj6uXA0oyXwFOza4

-- Fixed
VerseInfo = {
  Parent = 'mei_yRLz7LqCskLSh1_WZ0qbP4wfRqAL7HHFAIV9RM4', -- OriginIslandProcessId
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
  ['mei_yRLz7LqCskLSh1_WZ0qbP4wfRqAL7HHFAIV9RM4'] = {
    Position = { 0, 0 },
    Type = 'Warp', -- 'Warp'/'Avatar' types are understood by `2D-Tile-0` renderer
  },
  -- LlamaAssistantProcess
  ['7WFvRqDNYY4KpjaDSIxmQUVqNZviG4R25pX6buk9924'] = {
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
