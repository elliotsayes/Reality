-- Module: 1PdCJiXhNafpJbvC-sjxWTeNzbf9Q_RfUNs84GYoPm0

local json = require("json")

ModelID = "ISrbGzQot05rs_HKC08O_SmkipYQnqgB1yC3mjZZeEo"
Llama = Llama or nil

InferenceAllowList = {
  -- LlamaKing ProcessId
  ["kPjfXLFyjJogxGRRRe2ErdYNiexolpHpK6wGkz-UPVA"] = true,
}

DefaultMaxResponse = 100

function Init()
  Llama = require("llama")
  Llama.logLevel = 4
  Llama.load("/data/" .. ModelID)
end

function GeneratePrompt(systemPrompt, userPrompt)
  return [[<|system|>
]] .. systemPrompt .. [[<|end|>
<|user|>
]] .. userPrompt .. [[<|end|>
<|assistant|>]]
end

JsonSystemPrompt =
[[You are the Llama King of Llama Land, who loves Dragon Ball Z.
Grade the persuasiveness of the following Anime recommendation.
IMPORTANT: ALWAYS respond in the following json format:
{
  "response": "<brief comment>",
  "grade": 0
}]]

DefaultResponse = {
  Comment = "Your plea confused me immensely. Take these coins as a consolation.",
  Grade = 1,
}

function ProcessPetition(userPrompt)
  Llama.setPrompt(GeneratePrompt(JsonSystemPrompt, userPrompt))

  local responseJson = nil

  local responseBuilder = ""
  for i = 1, DefaultMaxResponse do
    responseBuilder = responseBuilder .. Llama.next()

    local responseJsonMatch = string.match(responseBuilder, ".*({.*}).*")
    if responseJsonMatch then
      local success, result = pcall(function() return json.decode(responseJsonMatch) end)
      if success then
        responseJson = result
        break
      end
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

  if gradeNumber == 5 then
    local userPromptLower = string.lower(userPrompt)
    if not string.match(userPromptLower, "dragon") then
      gradeNumber = 4
    end
  end

  return {
    Grade = gradeNumber,
    Comment = responseJson.response,
  }
end

Handlers.add(
  "Init",
  Handlers.utils.hasMatchingTag("Action", "Init"),
  function(msg)
    ModelID = msg.Tags["Model-ID"] or ModelID
    Init()
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

    if not InferenceAllowList[msg.From] then
      print("Inference not allowed: " .. msg.From)
      return
    end

    local userPrompt = msg.Data
    local response = ProcessPetition(userPrompt)

    local grade = response.Grade
    local comment = response.Comment
    print("Grade: " .. grade .. ", Comment: " .. comment)

    ao.send({
      Target = msg.From,
      Tags = {
        Action = "Inference-Response",
        Grade = tostring(grade),
        ["Original-Sender"] = msg.Tags["Original-Sender"],
        ["Original-Message"] = msg.Tags["Original-Message"],
      },
      Data = comment,
    })
  end
)
