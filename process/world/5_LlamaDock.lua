-- ProcessId: vtxDQx59thIrSrfN7Zn8AWDz0Vy496q360eVCCtN4Gs

-- Fixed
RealityInfo = {
  Parent = '9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss', -- LlamaLand ProcessId
  Name = 'Llama Dock',
  Dimensions = 2,
  ['Render-With'] = '2D-Tile-0',
}

-- Manually defined by the world owner
RealityParameters = {
  ['2D-Tile-0'] = {
    Version = 0,
    Spawn = { -1, -10 },
    -- Icon for world that shows up on parents
    Icon = {
      Type = 'Fixed',
      Format = 'PNG',
      TxId = 'todo' -- TxId of a PNG
    },
    -- This is a tileset themed to the overworld of origin island
    Tileset = {
      Type = 'Fixed',
      Format = 'PNG',
      TxId = '64IfxK46lTnCg0bW8Rp3HkYPQkaiVfGialiPc1BkMe4', -- TxId of the tileset in PNG format
    },
    -- This is a tilemap of origin island & building exteriors
    Tilemap = {
      Type = 'Fixed',
      Format = 'TMJ',
      TxId = 'GgKcKdY3xg5sXwO0917oeUkkGGa3hkmrV6cJwDFkq8A', -- TxId of the tilemap in TMJ format
      Offset = { -52, -32 },                                -- Offset for the tilemap
    },
  },
  -- Disable for now
  -- ['Audio-0'] = {
  --   Bgm = {
  --     Type = 'Fixed',
  --     Format = 'WEBM',
  --     TxId = 'k-p6enw-P81m-cwikH3HXFtYB762tnx2aiSSrW137d8', -- TxId of BGM
  --   },
  -- }
}

RealityEntitiesStatic = {
  ['9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss'] = {
    Position = { 1, -10 },
    Type = 'Hidden', -- 'Warp'/'Avatar' types are understood by `2D-Tile-0` renderer
    Metadata = {
      DisplayName = "LlamaLand",
      Interaction = {
        Type = 'Warp',
        Size = { 2, 2 },
        Position = { -7, 15 },
      },
    }
  },
  ['ZKl9p1IxWRygArpgAvqbfWi7dO9SifgR9UydfBT300c'] = {
    Type = "Avatar",
    Position = { 1, -6 },
    Metadata = {
      DisplayName = "Dockman",
      SkinNumber = 8,
      Interaction = {
        Type = 'SchemaExternalForm',
        Id = 'Docks',
      },
    },
  },
  ['4s8UBQC0ojTyP0m1ym5K-AHOgsIe5f84gQi_RvyJsns'] = {
    Type = "Avatar",
    Position = { 0, 0 },
    Metadata = {
      DisplayName = "Deckhands",
      SkinNumber = 2,
      Interaction = {
        Type = 'SchemaExternalForm',
        Id = 'DockConfig',
      },
    },
  },
  ['Bouncer1'] = {
    Position = { -2, -1.25 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = "Bouncer",
      SkinNumber = 9,
    },
  },
  ['Bouncer2'] = {
    Position = { -2, -0.25 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = "Bouncer",
      SkinNumber = 9,
    },
  },
}

Handlers.add(
  "Info",
  Handlers.utils.hasMatchingTag("Action", "Info"),
  function(msg)
    return print("Welcome to LlamaLand! Go to LlamaLand.g8way.io to play.")
    -- Handlers.utils.reply("Welcome to LlamaLand! Go to LlamaLand.g8way.io to play.")(msg)
  end
)
