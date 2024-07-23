local json = require('json')
-- LlamaLand
VERSE_TARGET = '9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss'
-- Testland
-- VERSE_TARGET = 'Kh-PHmaRt0bykGUgyK4euVSknML6yHIwQPyR5xPvXxg'

Send({
  Target = VERSE_TARGET,
  Tags = {
    Action = 'VerseEntityCreate',
  },
  Data = json.encode({
    Type = 'Hidden',
    -- By RHS boat
    Position = { 8.5, 15 },
    Metadata = {
      Interaction = {
        Type = 'Warp',
        Size = { 0.5, 1 }
      },
    }
  })
})

Send({
  Target = VERSE_TARGET,
  Tags = {
    Action = 'VerseEntityHide',
  },
})
