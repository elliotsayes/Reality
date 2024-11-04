-- Name: morse_world
-- ProcessId: Fg-xkUDpCRDruNDX8_1cnwmeWw1MRRStsvuKCWIw3p0

--#region Model

RealityInfo = {
  Dimensions = 2,
  Name = 'ExampleReality',
  ['Render-With'] = '2D-Tile-0',
}

RealityParameters = {
  Token = {
    Primary = 'pazXumQI-HPH7iFGfTC-4_7biSnqz_U67oFAGry5zUY',
    SchemaForm = {
      Target = '1FqYv_U-33tvg_4gwt6SeMlIqOa7KMEaXK6mvogMBss',
      Id = 'Leaderboard',
    }
  },
  ['2D-Tile-0'] = {
    Version = 0,
    Spawn = { 12, 17 },
    -- This is a tileset themed to Llama Land main island
    Tileset = {
      Type = 'Fixed',
      Format = 'PNG',
      TxId = 'aNBlmE61e2zV6NgFSGcZjthvNIUtsLNBFrHRLfGkDTo', -- TxId of the tileset in PNG format
    },
    -- This is a tilemap of sample small island
    Tilemap = {
      Type = 'Fixed',
      Format = 'TMJ',
      TxId = 'sR80MLkgQwyjFx3Fv-eLnNen7uT0z7v3o4LWmRdQr4o', -- TxId of the tilemap in TMJ format
      -- Since we are already setting the spawn in the middle, we don't need this
      -- Offset = { -10, -10 },
    },
  },
  ['Audio-0'] = {
    Bgm = {
      Type = 'Fixed',
      Format = 'WEBM',
      TxId = 'qaynB_f7aQPGC2Eb6FSZhYbMQT3Z0qGos7Sc1skVK6E',
    }
  },
}

RealityEntitiesStatic = {
  ['WarpExit'] = {
    Position = { 12, 20 },
    Type = 'Hidden',
    Metadata = {
      Interaction = {
        DisplayName = 'Back To Dock',
        Type = 'Warp',
        Size = { 0.5, 0.5 },
        Position = { 256, 145 },
        Target = "LryOv-VD-3m-lpJDhmu6x1Fj09CwVvx-ETvMe4jZvbw",
      },
    },
  },
  ['V1dqh-v4Z4u0nTGJhF-ntHwyeBjNqVcoLXgtW3n7jQk'] = {
    Position = { 12, 13 },
    Type = 'Avatar',
    Metadata = {
      DisplayName = 'Charlotte',
      SkinNumber = 2,
      Interaction = {
        Type = 'SchemaForm',
        Id = "Charlotte"
      },
    },
  },
}
--#endregion

return print("Loaded Reality Template")
