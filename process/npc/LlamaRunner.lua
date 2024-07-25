-- Name: LlamaRunner
-- ProcessId: ybn5uf4K2ITVgJWA8L8coJmdQLakFoOp0XCQjOyazZc

local json = require("json")

Initialized = Initialized or nil
TARGET_WORLD_PID = TARGET_WORLD_PID or "TODO: Put my Target Reality PID here"

TICK_COUNT = TICK_COUNT or 0

MinRunTime = MinRunTime or 5000

IsRunning = IsRunning or false
RunStage = RunStage or 1
LastRunStageTimestamp = LastRunStageTimestamp or 0

HomePosition = HomePosition or { 5, -5 }

function Register()
  print("Registering")
  Send({
    Target = TARGET_WORLD_PID,
    Tags = {
      Action = "Reality.EntityCreate",
    },
    Data = json.encode({
      Type = "Avatar",
      Position = HomePosition,
      Metadata = {
        DisplayName = "Llama Runner",
        Interaction = {
          Type = "SchemaForm",
          Id = "Loop",
        },
        SkinNumber = 1,
      },
    }),
  })
end

if (not Initialized) then
  Register()
end

Handlers.add(
  "Loop",
  Handlers.utils.hasMatchingTag("Action", "Loop"),
  function(msg)
    print("Loop")
    if not IsRunning then
      IsRunning = true
      Send({
        Target = TARGET_WORLD_PID,
        Tags = {
          Action = "ChatMessage",
          ['Author-Name'] = 'Llama Runner',
        },
        Data = 'Alright! I\'ll warm up, and then I\'m off!'
      })
    end
  end
)

Handlers.add(
  "CronTick",
  Handlers.utils.hasMatchingTag("Action", "Cron"),
  function(msg)
    print("CronTick")
    TICK_COUNT = TICK_COUNT + 1

    local elapsed = msg.Timestamp - LastRunStageTimestamp
    if elapsed < MinRunTime then
      return print("Too soon: " .. elapsed)
    end
    if not IsRunning then
      return print("Not running")
    end

    local positionTable = {
      { 5,  5 },
      { -5, 5 },
      { -5, -5 },
      HomePosition,
      nil,
    }

    local targetPosition = positionTable[RunStage]

    if targetPosition ~= nil then
      -- Move to the next position
      Send({
        Target = TARGET_WORLD_PID,
        Tags = {
          Action = "Reality.EntityUpdatePosition",
        },
        Data = json.encode({
          Position = targetPosition,
        }),
      })
    end

    if RunStage == 5 then
      Send({
        Target = TARGET_WORLD_PID,
        Tags = {
          Action = "ChatMessage",
          ['Author-Name'] = 'Llama Runner',
        },
        Data = 'And I\'m done. Phwef!'
      })
      -- Reset
      IsRunning = false
      RunStage = 1
      LastRunStageTimestamp = 0
    else
      RunStage = RunStage + 1
      LastRunStageTimestamp = msg.Timestamp
    end
  end
)

-- Schema

function LoopSchemaTags()
  return [[
{
"type": "object",
"required": [
  "Action"
],
"properties": {
  "Action": {
    "type": "string",
    "const": "Loop"
  },
}
}
]]
end

function SchemaCanRun()
  return {
    Loop = {
      Title = "Llama Runner is ready to race!",
      Description = "Click Submit to get the Llama Runner to run around Llama Land.",
      Schema = {
        Tags = json.decode(LoopSchemaTags()),
        -- Data
        -- Result?
      },
    },
  }
end

Handlers.add(
  'Schema',
  Handlers.utils.hasMatchingTag('Action', 'Schema'),
  function(msg)
    print('Schema')
    if IsRunning then
      Send({
        Target = msg.From,
        Tags = { Type = 'Schema' },
        Data = json.encode({
          Loop = {
            Title = "I'm busy running!",
            Description = "Come back when I've finished my loop.",
            Schema = nil,
          },
        })
      })
    else
      Send({
        Target = msg.From,
        Tags = { Type = 'Schema' },
        Data = json.encode(SchemaCanRun())
      })
    end
  end
)
