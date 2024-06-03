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
    Spawn = { 16, 20 },
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
      TxId = 'w0TEcX80cn6w4XcQnDOonbjtfEvu8Q6tsFWHKDZ8bM4', -- TxId of the tilemap in TMJ format
    },
  },
}

-- Updated by player actions
VerseEntities = {
  -- OriginIslandProcess
  ['a1C-TCUNUKCaEup0BiCXNwcVWxOVOiRBfmKuBZwPWZg'] = {
    Position = { 46, 46 },
    Type = 'Warp', -- 'Warp'/'Avatar' types are understood by `2D-Tile-0` renderer
  },
  -- LlamaAssistantProcess
  ['y_obnQk5mkphKlulM7v1Xyn6IhJKZGhP_BC1qLJq46w'] = {
    Position = { 49, 49 },
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
