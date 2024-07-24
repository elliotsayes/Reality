-- Name: LlamaComplainer
-- ProcessId: vwoIQclBFD7G9l1SKU8Cv3Sdoxa0Ku3F4Zd1c4IrU3g

local json = require("json")

TARGET_VERSE_PID = TARGET_VERSE_PID or "TODO: Put my Target Verse PID here"

TICK_COUNT = TICK_COUNT or 0
LAST_MESSAGE_ID = LAST_MESSAGE_ID or 0

Initialized = Initialized or nil

function Register()
  print("Registering as Verse Entity")
  Send({
    Target = TARGET_VERSE_PID,
    Tags = {
      Action = "VerseEntityCreate",
    },
    Data = json.encode({
      Type = "Avatar",
      Metadata = {
        DisplayName = "Llama Complainer",
        SkinNumber = 8,
      },
    }),
  })
end

if (not Initialized) then
  Register()
  -- Get Chat Count
  Send({
    Target = TARGET_VERSE_PID,
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
      Target = TARGET_VERSE_PID,
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
    if (msg.From ~= TARGET_VERSE_PID) then
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
      Target = TARGET_VERSE_PID,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'Llama Complainer',
      },
      Data = 'Goodness, Llamas are so noisy these days.'
    })

    -- Move to random position in the center
    Send({
      Target = TARGET_VERSE_PID,
      Tags = {
        Action = "VerseEntityUpdatePosition",
      },
      Data = json.encode({
        Position = {
          math.random(-4, 4),
          math.random(-3, 3),
        },
      }),
    })
  end
)
