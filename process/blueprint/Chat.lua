local json = require("json")
local sqlite3 = require('lsqlite3')

ChatDb = ChatDb or sqlite3.open_memory()
ChatDbAdmin = ChatDbAdmin or require('DbAdmin').new(ChatDb)

--#region Initialization

SQLITE_TABLE_CHAT_MESSAAGES = [[
  CREATE TABLE IF NOT EXISTS Messages (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    MessageId TEXT,
    Timestamp INTEGER,
    AuthorId TEXT,
    AuthorName TEXT,
    Content TEXT
  );
]]

function InitDb()
  ChatDb:exec(SQLITE_TABLE_CHAT_MESSAAGES)
end

Initialized = Initialized or false
if (not Initialized) then
  InitDb()
  Initialized = true
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
  if (string.match(authorName, "[^a-zA-Z0-9\\ _-]")) then
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
  if (string.len(content) > 100) then
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
      INSERT INTO Messages (MessageId, Timestamp, AuthorId, AuthorName, Content)
      VALUES (?, ?, ?, ?, ?)
    ]])
    stmt:bind_values(messageId, timestamp, authorId, authorName, content)
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
  "ChatHistory",
  Handlers.utils.hasMatchingTag("Action", "ChatHistory"),
  function(msg)
    -- print("ChatHistory")
    local idBefore = tonumber(msg.Tags['Id-Before'])
    local timestampStart = tonumber(msg.Tags['Timestamp-Start'])
    local timestampEnd = tonumber(msg.Tags['Timestamp-End'])
    local limit = tonumber(msg.Tags['Limit'])

    -- Validate Ids
    if (not ValidateId(idBefore)) then
      return print("Invalid Id End")
    end

    -- Validate Individual Timestamps
    if (not ValidateTimestamp(timestampStart)) then
      return print("Invalid Timestamp Start")
    end
    if (not ValidateTimestamp(timestampEnd)) then
      return print("Invalid Timestamp End")
    end

    -- Validate Range
    if (timestampStart ~= nil
          and timestampEnd ~= nil
          and timestampStart > timestampEnd) then
      return print("Invalid Timestamp Range")
    end

    -- Query messages
    -- Any variable maybe be nil
    -- Id is exclutive
    -- Timestamp is inclusive
    -- Default limit is 100
    local stmt = ChatDb:prepare([[
      SELECT * FROM Messages
      WHERE (Id < ? OR ? IS NULL)
      AND (Timestamp >= ? OR ? IS NULL)
      AND (Timestamp <= ? OR ? IS NULL)
      ORDER BY Timestamp DESC
      LIMIT ?
    ]])
    stmt:bind_values(
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
        Content = row.Content
      })
    end

    stmt:finalize()

    -- Reply with messages
    Handlers.utils.reply(json.encode(messages))(msg)
  end
)

return "Loaded Chat Protocol"
