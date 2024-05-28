local json = require("json")

VerseInfo = VerseInfo or {
  Parent = nil,
  Name = 'UnknownVerse',
  Dimensions = 0,
  -- TODO: Test this works
  ['Render-With'] = '0D-Null',
}

VerseParameters = VerseParameters or {}

VerseEntities = VerseEntities or {}

Handlers.add(
  "VerseInfo",
  Handlers.utils.hasMatchingTag("Action", "VerseInfo"),
  function(msg)
    print("VerseInfo")
    Handlers.utils.reply(json.encode(VerseInfo))(msg)
  end
)

Handlers.add(
  "VerseParameters",
  Handlers.utils.hasMatchingTag("Action", "VerseParameters"),
  function(msg)
    print("VerseParameters")
    Handlers.utils.reply(json.encode(VerseParameters))(msg)
  end
)

Handlers.add(
  "VerseEntities",
  Handlers.utils.hasMatchingTag("Action", "VerseEntities"),
  function(msg)
    print("VerseEntities")
    Handlers.utils.reply(json.encode(VerseEntities))(msg)
  end
)
