local json = require("json")

HasRegistered = HasRegistered or nil
LLAMA_LAND = "9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss"

LAST_MESSAGE_ID = LAST_MESSAGE_ID or 0

LLM_WORKER_PROCESS = LLM_WORKER_PROCESS or "TODO: LlamaWorkerProcessId"

TICK_COUNT = TICK_COUNT or 0

if (not HasRegistered) then
  print("Registering")
  Send({
    Target = LLAMA_LAND,
    Tags = {
      Action = "VerseEntityCreate",
    },
    Data = json.encode({
      Type = "Avatar",
    }),
  })
  HasRegistered = true;
end

Handlers.add(
  "CronTick",                                      -- handler name
  Handlers.utils.hasMatchingTag("Action", "Cron"), -- handler pattern to identify cron message
  function()                                       -- handler task to execute on cron message
    print("CronTick")
    TICK_COUNT = TICK_COUNT + 1

    -- Move to random position
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

    -- Respond to chat history
    if (TICK_COUNT % 5 == 0) then
      Send({
        Target = LLAMA_LAND,
        Tags = {
          Action = "ChatHistory",
          ["Id-After"] = tostring(LAST_MESSAGE_ID),
          Limit = tostring(10),
        },
      })
    end
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

    -- Sort by Id, lowest first
    table.sort(messages, function(a, b) return a.Id < b.Id end)

    local msgLog = ""
    for _, message in pairs(messages) do
      msgLog = msgLog .. message.AuthorName .. ": " .. message.Content .. "\n"
    end

    -- Send to LLM_WORKER_PROCESS
    Send({
      Target = LLM_WORKER_PROCESS,
      Tags = {
        Action = "Inference",
      },
      Data = msgLog,
    })

    -- Update last message id
    LAST_MESSAGE_ID = messages[#messages].Id
  end
)

Handlers.add(
  "InferenceResponseHandler",
  Handlers.utils.hasMatchingTag("Action", "Inference-Response"),
  function(msg)
    if (msg.From ~= LLM_WORKER_PROCESS) then
      return print("Inference-Response not from LlamaWorkerProcess")
    end

    -- Send to LlamaLand
    Send({
      Target = LLAMA_LAND,
      Tags = {
        Action = "ChatMessage",
        ["Author-Name"] = "Wandering Llama",
      },
      Data = msg.Data,
    })
  end
)
