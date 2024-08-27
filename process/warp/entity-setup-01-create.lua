local json = require("json")

Send({
  Target = DOCK_WORLD,
  Tags = {
    Action = "Reality.EntityCreate",
  },
  Data = json.encode({
    Position = WARP_POSITION,
    Type = "Hidden",
    Metadata = {
      DisplayName = DISPLAY_NAME,
      Interaction = {
        Type = "Warp",
        Size = { 1, 2 },
        Target = WARP_TARGET_WORLD,
      }
    }
  })
})
