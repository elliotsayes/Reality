local json = require('json')
-- LlamaLand
WORLD_TARGET = '9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss'
-- Testland
-- WORLD_TARGET = 'Kh-PHmaRt0bykGUgyK4euVSknML6yHIwQPyR5xPvXxg'

-- Send({
--   Target = WORLD_TARGET,
--   Tags = {
--     Action = 'Reality.EntityCreate',
--   },
--   Data = json.encode({
--     Type = 'Hidden',
--     -- By RHS boat
--     Position = { 8, 15 },
--     Metadata = {
--       Interaction = {
--         Type = 'Warp',
--         Size = { 0.5, 1 }
--       },
--     }
--   })
-- })

Send({
  Target = WORLD_TARGET,
  Tags = {
    Action = 'Reality.EntityUpdatePosition',
  },
  Data = json.encode({
    Position = { 8.5, 15 },
  })
})

Send({
  Target = WORLD_TARGET,
  Tags = {
    Action = 'Reality.EntityFix',
  },
})
