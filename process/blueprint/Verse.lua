local json = require("json")

--#region Model

VerseInfo = VerseInfo or {
  Parent = nil,
  Name = 'UnknownVerse',
  Dimensions = 0,
  -- TODO: Test this works
  ['Render-With'] = '0D-Null',
}

VerseParameters = VerseParameters or {}

VerseEntities = VerseEntities or {}

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
  "VerseEntities",
  Handlers.utils.hasMatchingTag("Action", "VerseEntities"),
  function(msg)
    print("VerseEntities")
    Handlers.utils.reply(json.encode(VerseEntities))(msg)
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

ValidTypes = { "Unknown", "Avatar", "Warp" }
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

    -- if (VerseEntities[entityId]) then
    --   return replyError(msg, "Entity already exists")
    -- end

    local data = json.decode(msg.Data)

    local Position = ZeroesArray(VerseInfo.Dimensions)
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

    local newEntity = {
      Position = Position,
      Type = Type,
    }

    VerseEntities[entityId] = newEntity

    Send({
      Target = msg.From,
      Tags = {
        MsgRef = msg.Id,
        Result = "OK",
      },
      Data = json.encode({
        [entityId] = newEntity,
      }),
    })
  end
)

Handlers.add(
  "VerseEntityUpdatePosition",
  Handlers.utils.hasMatchingTag("Action", "VerseEntityUpdatePosition"),
  function(msg)
    print("VerseEntityUpdatePosition")
    local entityId = msg.From

    if (not VerseEntities[entityId]) then
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

    VerseEntities[entityId].Position = Position
    Send({
      Target = msg.From,
      Tags = {
        MsgRef = msg.Id,
        Result = "OK",
      },
      Data = json.encode({
        [entityId] = VerseEntities[entityId],
      }),
    })
  end
)

--#endregion

return "Loaded Verse Protocol"
