-- Module: 1PdCJiXhNafpJbvC-sjxWTeNzbf9Q_RfUNs84GYoPm0

ModelID = "ISrbGzQot05rs_HKC08O_SmkipYQnqgB1yC3mjZZeEo"
Llama = Llama or nil

DefaultMaxResponse = 10
CoinsSystemPrompt =
    "You are a Llama king of a kingdom. " ..
    "A user wants you to give them some coins. Below is their reason. " ..
    "Give them coins based on the reason. " ..
    "Important: Respond tersely with a number of coins out of 10."

DefaultSystemPrompt =
    "You are the Llama king. " ..
    "The user wants coins. Below is their reason. " ..
    "Important: Respond only with a few words and GRADE: <number> 0 to 5."
InferenceAllowList = {
  -- LlamaKing ProcessId
  "",
}

function Init()
  Llama = require("llama")
  Llama.logLevel = 4
  Llama.load("/data/" .. ModelID)
end

function ProcessPetition(systemPrompt, userPrompt)
  Llama.setPrompt(GeneratePrompt(systemPrompt, userPrompt))
  local response = ""
  for i = 1, DefaultMaxResponse do
    response = response .. Llama.next()
    local match = string.match(response, "(%d+)")
    if match then
      return {
        Grade = tostring(match),
        Reason = response,
      }
    end
  end
  -- Default to 2
  return {
    Grade = "1",
    Reason = "Your plea confused me immensely. Take these coins as a consolation.",
  }
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
    Init()
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
