-- Module: 1PdCJiXhNafpJbvC-sjxWTeNzbf9Q_RfUNs84GYoPm0

ModelID = ModelID or "M-OzkyjxWhSvWYF87p0kvmkuAEEkvOzIj4nMNoSIydc"
Llama = Llama or nil

DefaultMaxResponse = 30
DefaultSystemPrompt =
    "You are a llama in a digital world. " ..
    "Below are messages from users nearby. Respond to them. " ..
    "Important: End your message with <END> "

InferenceAllowList = {
  -- LlamaWanderer ProcessId
  "_di-oSYyicR6IW5Dy7UzDxibD-paV23l_6-v0cziiA0",
}

function Init()
  Llama = require("llama")
  Llama.logLevel = 4
  Llama.load("/data/" .. ModelID)
end

function ProcessMessages(systemPrompt, userPrompt)
  Llama.setPrompt(GeneratePrompt(systemPrompt, userPrompt))
  local response = ""
  for i = 1, DefaultMaxResponse do
    response = response .. Llama.next()
    print("Response so far: " .. response)
    local match = string.match(response, "(.*)<END>")
    if match then
      return match
    end
  end
  return response
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
    Init()

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
    local msgLog = msg.Data
    local response = ProcessMessages(systemPrompt, msgLog)
    if not response then
      return print("No response generated")
    end

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
