-- Name: LlamaComplainer
-- ProcessId: vwoIQclBFD7G9l1SKU8Cv3Sdoxa0Ku3F4Zd1c4IrU3g

local json = require("json")

TARGET_WORLD_PID = TARGET_WORLD_PID or "TODO: Put my Target World PID here"

TICK_COUNT = TICK_COUNT or 0
LAST_MESSAGE_ID = LAST_MESSAGE_ID or 0

Initialized = Initialized or nil

function Register()
  print("Registering as Reality Entity")
  Send({
    Target = TARGET_WORLD_PID,
    Tags = {
      Action = "Reality.EntityCreate",
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
  -- Query the number of chat messages so far
  Send({
    Target = TARGET_WORLD_PID,
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

    -- Set `LAST_MESSAGE_ID` to the count of messages
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
      Target = TARGET_WORLD_PID,
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
    if (msg.From ~= TARGET_WORLD_PID) then
      return print("ChatHistoryResponse not from LlamaLand")
    end

    local chatMessages = json.decode(msg.Data)
    -- If empty, return
    if (not chatMessages or #chatMessages == 0) then
      return print("No new chat messages")
    end

    -- Update the last message id to the latest message,
    -- so we don't get the same messages again
    LAST_MESSAGE_ID = chatMessages[1].Id

    if (#chatMessages < 3) then
      return print("Not enough chat messages")
    end

    print("Got " .. #chatMessages .. " new chat messages")

    -- Each chat message is structured as follows:
    -- {
    --   Id = "Sequence of chat message"
    --   MessageId = "Id of the Message",
    --   Timestamp = "Timestamp the message was sent",
    --   AuthorId = "Address of the chat message's author",
    --   AuthorName = "Display name of that author",
    --   Recipient = "If it was intended for a specific recipient, their address",
    --   Content = "Content of the chat message",
    -- }
    -- Note: Chat messages are always ordered from newest to oldest

    for i, chatM in ipairs(chatMessages) do
      -- We could do something interesting here,
      -- but let's just print some info in the console
      print("Message from " .. (chatM.AuthorName or chatM.AuthorId) .. ": " .. chatM.Content)
    end

    -- Complain about the state of affairs
    Send({
      Target = TARGET_WORLD_PID,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'Llama Complainer',
      },
      Data = 'Goodness, Llamas are so noisy these days.'
    })

    -- Move to random position in the center
    Send({
      Target = TARGET_WORLD_PID,
      Tags = {
        Action = "Reality.EntityUpdatePosition",
      },
      Data = json.encode({
        -- You'll probably want to adjust these values to fit with your world
        Position = {
          math.random(-4, 4),
          math.random(-3, 3),
        },
      }),
    })
  end
)
