-- Module: 1PdCJiXhNafpJbvC-sjxWTeNzbf9Q_RfUNs84GYoPm0

ModelID = "ISrbGzQot05rs_HKC08O_SmkipYQnqgB1yC3mjZZeEo"
Llama = nil

DefaultMaxResponse = 5
DefaultSystemPrompt =
    "Your name is Wandering Llama. You are a Llama who wanders around in LlamaLand. " ..
    "Below are some messages from Llamas chatting nearby, Please respond to them. " ..
    "Important: End your message with the text <END>"

InferenceAllowList = {
  -- LlamaWanderer ProcessId
  "_di-oSYyicR6IW5Dy7UzDxibD-paV23l_6-v0cziiA0",
}

function Init(ModelID)
  Llama = require("llama")
  Llama.logLevel = 4
  Llama.load(ModelID)
end

function ProcessMessages(systemPrompt, userPrompt)
  Llama.setPrompt(GeneratePrompt(systemPrompt, userPrompt))
  local response = ""
  for i = 1, DefaultMaxResponse do
    response = Llama.next()
    local match = string.match(response, "(.*)<END>")
    if match then
      return match
    end
  end
end

function GeneratePrompt(systemPrompt, userPrompt)
  return "<|SYSTEM|>" .. systemPrompt
      .. "<|USER|>" .. userPrompt
      .. "<|ASSISTANT|>"
end

Handlers.add(
  "Init",
  Handlers.utils.hasMatchingTag("Action", "Init"),
  function(msg)
    ModelID = msg.Tags["Model-ID"] or ModelID
    Init(ModelID)

    DefaultSystemPrompt = msg.Tags.SystemPrompt or DefaultSystemPrompt
    DefaultMaxResponse = msg.Tags["Max-Response"] or DefaultMaxResponse

    Send({
      Action = "Responder-Initialized",
    })
  end
)

Handlers.add(
  "Inference",
  Handlers.utils.hasMatchingTag("Action", "Inference"),
  function(msg)
    print("Inference")

    -- Whitelist
    if not InferenceAllowList[msg.From] then
      print("Inference not allowed: " .. msg.From)
      return
    end

    local systemPrompt = msg.Tags.SystemPrompt or DefaultSystemPrompt
    local userPrompt = msg.Data
    local response = ProcessMessages(systemPrompt, userPrompt)

    Send({
      Target = msg.From,
      Tags = {
        Action = "Inference-Response",
        ["Original-Sender"] = msg.Tags["Original-Sender"],
        ["Original-Message"] = msg.Tags["Original-Message"],
      },
      Data = response,
    })
  end
)
