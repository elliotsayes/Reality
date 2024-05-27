local json = require("json")

ChatHistory = ChatHistory or {
  -- ['msgId'] = {
  --   Timestamp = 0,
  --   Author = 'SomeTxId',
  --   Content = 'Hello World!',
  -- }
}

Handlers.add(
  "ChatMessage",
  Handlers.utils.hasMatchingTag("Action", "ChatMessage"),
  function(msg)
    local entry = {
      Timestamp = msg.Timestamp,
      Author = msg.From,
      Content = msg.Data,
    }
    ChatHistory[msg.Id] = entry
  end
)

Handlers.add(
  "ChatHistory",
  Handlers.utils.hasMatchingTag("Action", "ChatHistory"),
  function(msg)
    Handlers.utils.reply(json.encode(ChatHistory))(msg)
  end
)
