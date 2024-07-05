-- ProcessId:

local json = require("json")

Initialized = Initialized or nil
LLAMA_LAND = LLAMA_LAND or "9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss"

TICK_COUNT = TICK_COUNT or 0

LAST_MESSAGE_ID = LAST_MESSAGE_ID or 0

if (not Initialized) then
  print("Registering")
  Send({
    Target = LLAMA_LAND,
    Tags = {
      Action = "VerseEntityCreate",
    },
    Data = json.encode({
      Type = "Avatar",
      Metadata = {
        DisplayName = "Llama Wanderer",
      },
    }),
  })
  -- Get Chat Count
  Send({
    Target = LLAMA_LAND,
    Tags = {
      Action = "ChatCount",
    },
  })
end

Handlers.add(
  "ChatCountResponse",
  Handlers.utils.hasMatchingTag("Action", "ChatCountResponse"),
  function(msg)
    print("ChatCountResponse")
    local count = tonumber(msg.Data)
    print("Chat Count: " .. (count or "nil"))
    if (count) then
      LAST_MESSAGE_ID = count
    end
    Initialized = true;
  end
)

Handlers.add(
  "CronTick",                                      -- handler name
  Handlers.utils.hasMatchingTag("Action", "Cron"), -- handler pattern to identify cron message
  function()                                       -- handler task to execute on cron message
    print("CronTick")
    if (not Initialized) then
      return print("Not initialized")
    end

    TICK_COUNT = TICK_COUNT + 1

    Send({
      Target = LLAMA_LAND,
      Tags = {
        Action = "ChatHistory",
        ["Id-After"] = tostring(LAST_MESSAGE_ID),
        Limit = tostring(100),
      },
    })
  end
)

Handlers.add(
  "ChatHistoryResponseHandler",
  Handlers.utils.hasMatchingTag("Action", "ChatHistoryResponse"),
  function(msg)
    if (msg.From ~= LLAMA_LAND) then
      return print("ChatHistoryResponse not from LlamaLand")
    end

    local messages = json.decode(msg.Data)
    -- If empty, return
    if (not messages or #messages == 0) then
      return print("No new messages")
    end

    -- Update the last message id so we don't get the same messages again
    LAST_MESSAGE_ID = messages[1].Id

    if (#messages < 3) then
      return print("Not enough messages")
    end

    -- We could do something with messages, but right now we aren't
    print("Got " .. #messages .. " new messages")

    -- Complain about the state of affairs
    Send({
      Target = LLAMA_LAND,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'Llama Wanderer',
      },
      Data = 'Goodness, Llamas are so noisy these days.'
    })

    -- Move to random position in the center
    Send({
      Target = LLAMA_LAND,
      Tags = {
        Action = "VerseEntityUpdatePosition",
      },
      Data = json.encode({
        Position = {
          math.random(-5, 0),
          math.random(-5, 0),
        },
      }),
    })
  end
)
