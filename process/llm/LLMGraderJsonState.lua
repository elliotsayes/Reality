-- Module: XcWULRSWWv_bmaEyx4PEOFf4vgRSVCP9vM5AucRvI40

local json = require("json")

ModelID = ModelID or "ISrbGzQot05rs_HKC08O_SmkipYQnqgB1yC3mjZZeEo"
Llama = Llama or nil

InferenceAllowList = {
  -- LlamaKing ProcessId
  ["kPjfXLFyjJogxGRRRe2ErdYNiexolpHpK6wGkz-UPVA"] = true,
}

DefaultMaxResponse = DefaultMaxResponse or 80
DefaultTemperature = 1.0

JsonSystemPrompt =
[[You are the Llama King of Llama Land, with a harsh and eccentric personality.

A subject is making a plea to be granted Llama Coin. The plea is limited to a paragraph, and the subject is prohibited from supplying additional evidence.

You must grade the quality of a subject's plea for Llama Coin, 0-5. A higher grade means the subject will receive more Llama coins. Judge as best you can based only on the following plea.

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

function Configure()
  local initialPrompt = PrimePromptText(JsonSystemPrompt)
  print("Initial Prompt: " .. initialPrompt)
  Llama.setPrompt(initialPrompt)
  Llama.setTemp(DefaultTemperature)

  print("Save state")
  Llama.saveState()
end

function Init()
  Llama = require("llama")
  Llama.logLevel = 4

  print("Loading model: " .. ModelID)
  Llama.load("/data/" .. ModelID)

  Configure()
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
      print("responseJsonMatch: " .. responseJsonMatch)
      responseJson = json.decode(responseJsonMatch)
      break
    end
  end

  if not responseJson or not responseJson.grade or not responseJson.response then
    print("Unusable response: " .. responseBuilder)
    return DefaultResponse
  end

  -- Parse the grade
  local gradeNumber = tonumber(responseJson.grade)
  if not gradeNumber then
    print("Invalid grade: " .. responseJson.grade)
    return DefaultResponse
  end

  -- Clamp the grade
  gradeNumber = math.min(5, math.max(0, math.floor(gradeNumber)))

  return {
    Grade = gradeNumber,
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
    if not InferenceAllowList[msg.From] then
      print("Inference not allowed: " .. msg.From)
      return
    end

    -- Timestamp is random enough for now
    local seed = msg.Timestamp
    Llama.setSeed(seed)

    local userPrompt = msg.Data
    local response = ProcessPetition(userPrompt)

    local grade = response.Grade
    local comment = response.Comment
    print("Grade: " .. grade .. ", Comment: " .. comment)

    Send({
      Target = msg.From,
      Tags = {
        Action = "Inference-Response",
        Grade = tostring(grade),
        ["Original-Sender"] = msg.Tags["Original-Sender"],
        ["Original-Message"] = msg.Tags["Original-Message"],
      },
      Data = comment,
    })

    print("Load state")
    Llama.loadState()
  end
)
