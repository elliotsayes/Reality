local json = require("json")

Handlers.add(
  "VerseInfo",
  Handlers.utils.hasMatchingTag("Action", "VerseInfo"),
  function(msg)
    Handlers.utils.reply(json.encode(VerseInfo))(msg)
  end
)

Handlers.add(
  "VerseParameters",
  Handlers.utils.hasMatchingTag("Action", "VerseParameters"),
  function(msg)
    Handlers.utils.reply(json.encode(VerseParameters))(msg)
  end
)

Handlers.add(
  "VerseEntities",
  Handlers.utils.hasMatchingTag("Action", "VerseEntities"),
  function(msg)
    Handlers.utils.reply(json.encode(VerseEntities))(msg)
  end
)
