local json = require('json')
local sqlite3 = require('lsqlite3')

VerseDb = VerseDb or sqlite3.open_memory()
VerseDbAdmin = VerseDbAdmin or require('DbAdmin').new(VerseDb)

--#region Initialization

SQLITE_TABLE_VERSE_ENTITIES = [[
  CREATE TABLE IF NOT EXISTS Entities (
    Id TEXT PRIMARY KEY,
    LastUpdated INTEGER NOT NULL,
    Position TEXT NOT NULL,
    Type TEXT NOT NULL,
    Metadata TEXT NOT NULL,
    StateCode INTEGER NOT NULL DEFAULT 2
  );
]]

-- State Codes
-- 0 - Hidden
-- 1 - VisibleAlways
-- 2 - VisibleRecent

function VerseDbInit()
  VerseDb:exec(SQLITE_TABLE_VERSE_ENTITIES)
end

VerseInitialized = VerseInitialized or false
if (not VerseInitialized) then
  VerseDbInit()
  VerseInitialized = true
end

function SetStateCode(timestamp, entityId, stateCode)
  VerseDbAdmin:exec(string.format([[
      UPDATE Entities
      SET StateCode = %d,
          LastUpdated = %d
      WHERE Id = '%s'
    ]],
    stateCode or 2,
    timestamp,
    entityId
  ))
end

--#endregion

--#region Model

VerseInfo = VerseInfo or {
  Parent = nil,
  Name = 'UnknownVerse',
  Dimensions = 0,
  Spawn = {},
  ['Render-With'] = '0D-Null',
}

VerseParameters = VerseParameters or {}

VerseEntitiesStatic = VerseEntitiesStatic or {}

--#endregion

--#region ReadHandlers

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
  "VerseEntitiesStatic",
  Handlers.utils.hasMatchingTag("Action", "VerseEntitiesStatic"),
  function(msg)
    print("VerseEntitiesStatic")
    Handlers.utils.reply(json.encode(VerseEntitiesStatic))(msg)
  end
)

Handlers.add(
  "VerseEntitiesDynamic",
  Handlers.utils.hasMatchingTag("Action", "VerseEntitiesDynamic"),
  function(msg)
    print("VerseEntitiesDynamic")

    local data = json.decode(msg.Data)
    if (not data) then
      ReplyError(msg, "Invalid Data")
      return
    end
    local queryTimestamp = data.Timestamp
    -- Validate timestamp
    if (type(queryTimestamp) ~= "number") then
      ReplyError(msg, "Invalid Timestamp")
      return
    end

    local isInitial = data.Initial or false

    local additionalQuery = "LastUpdated > ?"
    if (isInitial) then
      additionalQuery = "(LastUpdated > ? AND StateCode == 2) OR StateCode == 1"
    end
    local query = VerseDb:prepare([[
      SELECT *
      FROM Entities
      WHERE Id == ? OR ]] .. additionalQuery
    )
    query:bind_values(msg.From, queryTimestamp)

    local entities = {}
    for row in query:nrows() do
      entities[row.Id] = {
        Position = json.decode(row.Position),
        Type = row.Type,
        Metadata = json.decode(row.Metadata),
        StateCode = row.StateCode,
      }
    end

    Handlers.utils.reply(json.encode(entities))(msg)
  end
)

--#endregion

--#region WriteHandlers

function ReplyError(msg, error)
  print("[" .. msg.From .. " => " .. msg.Id .. "] Error: " .. error)
  Send({
    Target = msg.From,
    Tags = {
      MsgRef = msg.Id,
      Result = "Error",
    },
    Error = error,
  })
end

function ZeroesArray(size)
  local arr = {}
  for i = 1, size do
    arr[i] = 0
  end
  return arr
end

function ValidatePosition(Position)
  if (not Position) then
    return false, "Position not found"
  end

  if (#Position ~= VerseInfo.Dimensions) then
    return false, "Invalid Position length"
  end

  for i = 1, #Position do
    if (type(Position[i]) ~= "number") then
      return false, "Invalid Position value"
    end
  end

  return true
end

ValidTypes = { "Unknown", "Avatar", "Hidden" }
function ValidateType(Type)
  for i = 1, #ValidTypes do
    if (Type == ValidTypes[i]) then
      return true
    end
  end

  return false
end

Handlers.add(
  "VerseEntityCreate",
  Handlers.utils.hasMatchingTag("Action", "VerseEntityCreate"),
  function(msg)
    print("VerseEntityCreate")
    local entityId = msg.From

    local data = json.decode(msg.Data)

    local Position = VerseInfo.Spawn or ZeroesArray(VerseInfo.Dimensions)
    if (data.Position) then
      local valid, error = ValidatePosition(data.Position)

      if (not valid) then
        ReplyError(msg, error)
        return
      end

      Position = data.Position
    end

    local Type = "Unknown"
    if (data.Type) then
      if (not ValidateType(data.Type)) then
        ReplyError(msg, "Invalid Type")
        return
      end

      Type = data.Type
    end

    -- Is it necessary to validate this?
    local Metadata = data.Metadata or {}

    -- Ugly workaround for empty tables!
    Metadata['_'] = false;

    local stmt = VerseDb:prepare([[
        INSERT INTO Entities (Id, LastUpdated, Position, Type, Metadata)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(Id) DO UPDATE SET
          LastUpdated = excluded.LastUpdated,
          Type = excluded.Type,
          Metadata = excluded.Metadata,
          StateCode = 2
    ]])
    -- StateCode is reset to default, if it was hidden
    stmt:bind_values(
      entityId,
      msg.Timestamp,
      json.encode(Position),
      Type,
      json.encode(Metadata)
    )
    stmt:step()
    stmt:finalize()

    local result = {
      [entityId] = {
        Position = Position,
        Type = Type,
        Metadata = Metadata
      }
    }

    Send({
      Target = msg.From,
      Tags = {
        MsgRef = msg.Id,
        Result = "OK",
      },
      Data = json.encode(result),
    })
  end
)

Handlers.add(
  "VerseEntityUpdatePosition",
  Handlers.utils.hasMatchingTag("Action", "VerseEntityUpdatePosition"),
  function(msg)
    print("VerseEntityUpdatePosition")
    local entityId = msg.From

    local dbEntry = VerseDbAdmin:exec(string.format([[
        SELECT * FROM Entities WHERE Id = '%s'
      ]],
      entityId
    ))[1]
    if (not dbEntry) then
      ReplyError(msg, "Entity not found")
      return
    end

    local data = json.decode(msg.Data)

    local Position = data.Position
    local valid, error = ValidatePosition(Position)
    if (not valid) then
      ReplyError(msg, error)
      return
    end

    VerseDbAdmin:exec(string.format([[
        UPDATE Entities
        SET LastUpdated = %d, Position = '%s'
        WHERE Id = '%s'
      ]],
      msg.Timestamp,
      json.encode(Position),
      entityId
    ))

    local result = {
      [entityId] = {
        Position = Position,
      }
    }

    Send({
      Target = msg.From,
      Tags = {
        MsgRef = msg.Id,
        Result = "OK",
      },
      Data = json.encode(result),
    })
  end
)

Handlers.add(
  "VerseEntityHide",
  Handlers.utils.hasMatchingTag("Action", "VerseEntityHide"),
  function(msg)
    print("VerseEntityHide")
    local entityId = msg.Tags['EntityId'] or msg.From

    local dbEntry = VerseDbAdmin:exec(string.format([[
        SELECT * FROM Entities WHERE Id = '%s'
      ]],
      entityId
    ))[1]
    if (not dbEntry) then
      ReplyError(msg, "Entity not found")
      return
    end

    SetStateCode(msg.Timestamp, entityId, 0)

    Send({
      Target = msg.From,
      Tags = {
        MsgRef = msg.Id,
        Result = "OK",
      },
    })
  end
)

Handlers.add(
  "VerseEntityFix",
  Handlers.utils.hasMatchingTag("Action", "VerseEntityFix"),
  function(msg)
    print("VerseEntityFix")
    local entityId = msg.Tags['EntityId'] or msg.From

    local dbEntry = VerseDbAdmin:exec(string.format([[
        SELECT * FROM Entities WHERE Id = '%s'
      ]],
      entityId
    ))[1]
    if (not dbEntry) then
      ReplyError(msg, "Entity not found")
      return
    end

    SetStateCode(msg.Timestamp, entityId, 1)

    Send({
      Target = msg.From,
      Tags = {
        MsgRef = msg.Id,
        Result = "OK",
      },
    })
  end
)

--#endregion

return "Loaded Verse Protocol"
