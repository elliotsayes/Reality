local json = require("json")
local sqlite3 = require('lsqlite3')

ChatDb = ChatDb or sqlite3.open_memory()
ChatDbAdmin = ChatDbAdmin or require('DbAdmin').new(ChatDb)

--#region Initialization

SQLITE_TABLE_CHAT_MESSAGES = [[
  CREATE TABLE IF NOT EXISTS Messages (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    MessageId TEXT UNIQUE NOT NULL,
    Timestamp INTEGER NOT NULL,
    AuthorId TEXT NOT NULL,
    AuthorName TEXT DEFAULT NULL,
    Recipient TEXT DEFAULT NULL,
    Content TEXT
  );
]]

function ChatDbInit()
  ChatDb:exec(SQLITE_TABLE_CHAT_MESSAGES)
end

ChatInitialized = ChatInitialized or false
if (not ChatInitialized) then
  ChatDbInit()
  ChatInitialized = true
end

--#endregion

function ValidateAuthorName(authorName)
  if (authorName == nil) then
    return false
  end
  if (string.len(authorName) < 1) then
    return false
  end
  if (string.len(authorName) > 20) then
    return false
  end

  return true
end

function ValidateContent(content)
  if (content == nil) then
    return false
  end
  if (string.len(content) < 1) then
    return false
  end
  if (string.len(content) > 1000) then
    return false
  end
  -- Note: Input sanitization is not performed here, but by the bind function

  return true
end

Handlers.add(
  "ChatMessage",
  Handlers.utils.hasMatchingTag("Action", "ChatMessage"),
  function(msg)
    -- print("ChatMessage")
    local messageId = msg.Id
    local timestamp = msg.Timestamp
    local authorId = msg.From
    local authorName = msg.Tags['Author-Name']
    local recipient = msg.Tags['Recipient']
    local content = msg.Data

    -- Validate AuthorName
    if (not ValidateAuthorName(authorName)) then
      return print("Invalid Author Name")
    end

    -- Validate Content
    if (not ValidateContent(content)) then
      return print("Invalid Content")
    end

    -- Save message
    local stmt = ChatDb:prepare([[
      INSERT INTO Messages (MessageId, Timestamp, AuthorId, AuthorName, Recipient, Content)
      VALUES (?, ?, ?, ?, ?, ?)
    ]])
    stmt:bind_values(messageId, timestamp, authorId, authorName, recipient, content)
    stmt:step()
    stmt:finalize()

    return print("Message saved")
  end
)


function ValidateId(testId)
  if (testId == nil) then
    -- Allow nil ids
    return true
  end
  if (type(testId) ~= "number") then
    return false
  end
  if (testId < 0) then
    return false
  end

  return true
end

function ValidateTimestamp(testTimestamp)
  if (testTimestamp == nil) then
    -- Allow nil timestamps
    return true
  end
  if (testTimestamp < 0) then
    return false
  end

  return true
end

function ValidateLimit(testLimit)
  if (testLimit == nil) then
    -- Allow nil limits
    return true
  end
  if (testLimit < 1) then
    return false
  end
  if (testLimit > 100) then
    return false
  end

  return true
end

Handlers.add(
  'ChatCount',
  Handlers.utils.hasMatchingTag('Action', 'ChatCount'),
  function(msg)
    -- print("ChatCount")
    local stmt = ChatDb:prepare("SELECT COUNT(*) FROM Messages")
    stmt:step()
    local count = stmt:get_value(0)
    stmt:finalize()

    Send({
      Target = msg.From,
      Tags = {
        Action = 'ChatCountResponse',
      },
      Data = tostring(count)
    })
  end
)

Handlers.add(
  "ChatHistory",
  Handlers.utils.hasMatchingTag("Action", "ChatHistory"),
  function(msg)
    -- print("ChatHistory")
    local idAfter = tonumber(msg.Tags['Id-After'])
    local idBefore = tonumber(msg.Tags['Id-Before'])
    local timestampStart = tonumber(msg.Tags['Timestamp-Start'])
    local timestampEnd = tonumber(msg.Tags['Timestamp-End'])
    local limit = tonumber(msg.Tags['Limit'])

    -- Validate individual Ids
    if (not ValidateId(idAfter)) then
      return print("Invalid Id Start")
    end
    if (not ValidateId(idBefore)) then
      return print("Invalid Id End")
    end
    -- Validate Ids range
    if (idAfter ~= nil
          and idBefore ~= nil
          and idAfter > idBefore) then
      return print("Invalid Id Range")
    end

    -- Validate Individual Timestamps
    if (not ValidateTimestamp(timestampStart)) then
      return print("Invalid Timestamp Start")
    end
    if (not ValidateTimestamp(timestampEnd)) then
      return print("Invalid Timestamp End")
    end
    -- Validate timestamp range
    if (timestampStart ~= nil
          and timestampEnd ~= nil
          and timestampStart > timestampEnd) then
      return print("Invalid Timestamp Range")
    end

    -- Query messages
    -- Any variable maybe be nil
    -- Ids are EXclusive
    -- Timestamps are INclusive
    -- Most recent first
    -- Default limit is 100
    local stmt = ChatDb:prepare([[
      SELECT * FROM Messages
      WHERE (Id > ? OR ? IS NULL)
      AND (Id < ? OR ? IS NULL)
      AND (Timestamp >= ? OR ? IS NULL)
      AND (Timestamp <= ? OR ? IS NULL)
      ORDER BY Timestamp DESC
      LIMIT ?
    ]])
    stmt:bind_values(
      idAfter, idAfter,
      idBefore, idBefore,
      timestampStart, timestampStart,
      timestampEnd, timestampEnd,
      limit or 100
    )

    local messages = {}
    for row in stmt:nrows() do
      table.insert(messages, {
        Id = row.Id,
        MessageId = row.MessageId,
        Timestamp = row.Timestamp,
        AuthorId = row.AuthorId,
        AuthorName = row.AuthorName,
        Recipient = row.Recipient,
        Content = row.Content
      })
    end

    stmt:finalize()

    -- Reply with messages
    Send({
      Target = msg.From,
      Tags = {
        Action = "ChatHistoryResponse",
      },
      Data = json.encode(messages)
    })
  end
)

return "Loaded Chat Protocol"
