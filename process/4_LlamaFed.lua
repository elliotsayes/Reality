-- ProcessId: IN3T2l6QERA6d65XGW5asx2JWX7VrOQ3HIbwQvKVBQo

-- Fixed
VerseInfo = {
  Parent = 'a1C-TCUNUKCaEup0BiCXNwcVWxOVOiRBfmKuBZwPWZg', -- OriginIslandProcessId
  Name = 'Llama Fed',
  Dimensions = 2,
  ['Render-With'] = '2D-Tile-0',
}

-- Manually defined by the verse owner
VerseParameters = {
  ['2D-Tile-0'] = {
    Version = 0,
    Spawn = { 47, 47 },
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
  ['a1C-TCUNUKCaEup0BiCXNwcVWxOVOiRBfmKuBZwPWZg'] = {
    Position = { 0, 0 },
    Type = 'Warp', -- 'Warp'/'Avatar' types are understood by `2D-Tile-0` renderer
  },
  -- LlamaAssistantProcess
  ['y_obnQk5mkphKlulM7v1Xyn6IhJKZGhP_BC1qLJq46w'] = {
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
