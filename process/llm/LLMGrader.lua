-- Module: 1PdCJiXhNafpJbvC-sjxWTeNzbf9Q_RfUNs84GYoPm0

ModelID = "ISrbGzQot05rs_HKC08O_SmkipYQnqgB1yC3mjZZeEo"
Llama = nil

DefaultMaxResponse = 10
DefaultSystemPrompt =
    "You are a Llama king of a kingdom. " ..
    "You are a good king and you really like grass."

InferenceAllowList = {
  -- LlamaKing ProcessId
  "",
}

function Init(ModelID)
  Llama = require("llama")
  Llama.logLevel = 4
  Llama.load(ModelID)
end

function ProcessPetition(systemPrompt, userPrompt)
  Llama.setPrompt(GeneratePrompt(systemPrompt, userPrompt))
  local response = ""
  for i = 1, DefaultMaxResponse do
    response = Llama.next()
    local match = string.match(response, "GRADE:%s*(%d+)")
    if match then
      return match, response
    end
  end
  -- Default to 2
  return "2", "Your plea confused me immensely. Take these coins as a consolation."
end

function GeneratePrompt(systemPrompt, userPrompt)
  return "<|SYSTEM|>" ..
      systemPrompt .. "<|USER|>" ..
      userPrompt .. "<|ASSISTANT|>"
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
      Action = "Grader-Initialized",
    })
  end
)

Handlers.add(
  "Inference",
  Handlers.utils.hasMatchingTag("Action", "Inference"),
  function(msg)
    print("Inference")

    -- TODO: Whitelist
    -- if not InferenceAllowList[msg.From] then
    --   print("Inference not allowed: " .. msg.From)
    --   return
    -- end

    local systemPrompt = msg.Tags.SystemPrompt or DefaultSystemPrompt
    local userPrompt = msg.Data
    local Grade, Reason = ProcessPetition(systemPrompt, userPrompt)
    print("Grade: " .. Grade .. ", Reason: " .. Reason)

    ao.send({
      Target = msg.From,
      Tags = {
        Action = "Inference-Response",
        Grade = Grade,
        ["Original-Sender"] = msg.Tags["Original-Sender"],
        ["Original-Message"] = msg.Tags["Original-Message"],
      },
      Data = Reason,
    })
  end
)
