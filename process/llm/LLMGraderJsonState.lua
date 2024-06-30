-- Module: 1PdCJiXhNafpJbvC-sjxWTeNzbf9Q_RfUNs84GYoPm0

local json = require("json")

ModelID = ModelID or "ISrbGzQot05rs_HKC08O_SmkipYQnqgB1yC3mjZZeEo"
Llama = Llama or nil

InferenceAllowList = {
  -- LlamaKing ProcessId
  "",
}

DefaultMaxResponse = 50

JsonSystemPrompt =
[[You are the Llama King of Llama Land, with a harsh and eccentric personality.
You must grade the quality of the user's plea for Llama Coin, 0-5.
IMPORTANT: ALWAYS respond in the following json format:
{
  "response": "<brief response>",
  "grade": 0
}]]

function PrimePromptText(systemPrompt)
  return [[<|system|>
]] .. systemPrompt .. [[<|end|>
<|user|>
]]
end

function Init()
  Llama = require("llama")
  Llama.logLevel = 4

  print("Loading model: " .. ModelID)
  Llama.load("/data/" .. ModelID)

  local initialPrompt = PrimePromptText(JsonSystemPrompt)
  print("Initial Prompt: " .. initialPrompt)
  Llama.setPrompt(initialPrompt)

  print("Save state")
  Llama.saveState()
end

function CompletePromptText(userPrompt)
  return userPrompt .. [[<|end|>
<|assistant|>]]
end

DefaultResponse = {
  Comment = "Your plea confused me immensely. Take these coins as a consolation.",
  Grade = "1",
}

function ProcessPetition(userPrompt)
  local additionalPrompt = CompletePromptText(userPrompt)
  print("Additional Prompt: " .. additionalPrompt)
  Llama.add(additionalPrompt)

  local responseJson = nil

  local responseBuilder = ""
  for i = 1, DefaultMaxResponse do
    responseBuilder = responseBuilder .. Llama.next()

    local responseJsonMatch = string.match(responseBuilder, ".*({.*}).*")
    if responseJsonMatch then
      responseJson = json.decode(responseJsonMatch)
      break
    end
  end

  if not responseJson or not responseJson.grade or not responseJson.response then
    return DefaultResponse
  end

  return {
    Grade = responseJson.grade,
    Comment = responseJson.response,
  }
end

Handlers.add(
  "Init",
  Handlers.utils.hasMatchingTag("Action", "Init"),
  function(msg)
    if msg.From ~= ao.id then
      return print("Init not allowed: " .. msg.From)
    end

    ModelID = msg.Tags["Model-ID"] or ModelID
    DefaultMaxResponse = msg.Tags["Max-Response"] or DefaultMaxResponse
    Init()
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

    local userPrompt = msg.Data
    local response = ProcessPetition(userPrompt)

    local grade = response.Grade
    local comment = response.Comment
    print("Grade: " .. grade .. ", Comment: " .. comment)

    Send({
      Target = msg.From,
      Tags = {
        Action = "Inference-Response",
        Grade = grade,
        ["Original-Sender"] = msg.Tags["Original-Sender"],
        ["Original-Message"] = msg.Tags["Original-Message"],
      },
      Data = comment,
    })

    print("Load state")
    Llama.loadState()
  end
)
