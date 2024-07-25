-- ProcessId: QIFgbqEmk5MyJy01wuINfcRP_erGNNbhqHRkAQjxKgg

-- Fixed
RealityInfo = {
  Parent = '9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss', -- OriginIslandProcessId
  Name = 'Llama Fed',
  Dimensions = 2,
  ['Render-With'] = '2D-Tile-0',
}

-- Manually defined by the world owner
RealityParameters = {
  ['2D-Tile-0'] = {
    Version = 0,
    Spawn = { 16, 19 },
    -- This is the interior tileset enforced by origin island world
    Tileset = {
      Type = 'Fixed',
      Format = 'PNG',
      TxId = 'iF0xdDoGMGjnEYD0s4AbsZz2OK7xROj_KnPZ_3wZFRU', -- TxId of the tileset in PNG format
    },
    -- This will be a tilemap the interior of the llama fed
    Tilemap = {
      Type = 'Fixed',
      Format = 'TMJ',
      TxId = 'KNUEc-ZsXB7ri-qBuXT-TfxNu41Dn2eUIU2FFYDjWu8', -- TxId of the tilemap in TMJ format
    },
  },
}

-- Updated by player actions
RealityEntitiesStatic = {
  -- OriginIslandProcess
  ['9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss'] = {
    Position = { 16, 21 },
    Type = 'Hidden', -- 'Warp'/'Avatar' types are understood by `2D-Tile-0` renderer
    Metadata = {
      Interaction = {
        Type = 'Warp',
        Size = { 3, 1 }
      },
    }
  },
  -- LlamaKingDummyProcess
  ['kPjfXLFyjJogxGRRRe2ErdYNiexolpHpK6wGkz-UPVA'] = {
    Position = { 15.875, 2.5 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Llama King',
      SkinNumber = 7,
      Interaction = {
        Type = 'SchemaExternalForm',
        Id = 'Petition',
      },
    },
  },
  -- LlamaBankerDummyProcess
  ['ptvbacSmqJPfgCXxPc9bcobs5Th2B_SxTf81vRNkRzk'] = {
    Position = { 18.875, 2.5 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Llama Banker',
      SkinNumber = 8,
      Interaction = {
        Type = 'SchemaForm',
        Id = 'Balance',
      },
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
