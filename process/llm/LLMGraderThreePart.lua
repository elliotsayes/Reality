-- Module: 1PdCJiXhNafpJbvC-sjxWTeNzbf9Q_RfUNs84GYoPm0

ModelID = "ISrbGzQot05rs_HKC08O_SmkipYQnqgB1yC3mjZZeEo"
Llama = Llama or nil

InferenceAllowList = {
  -- LlamaKing ProcessId
  "",
}

CommentMaxResponse = 70
GradeMaxResponse = 10

function Init()
  Llama = require("llama")
  Llama.logLevel = 4
  Llama.load("/data/" .. ModelID)
end

CommentSystemPrompt =
    "You are the Llama King of Llama Land, with a hash and eccentric personality.\n" ..
    "Give a VERY brief comment assessing the quality of the users's plea for Llama coin."
GradeSystemPrompt =
    "Grade the sentiment of the comment between 0 and 5. E.g.:\n" ..
    "GRADE:0"
DefaultResponse = {
  Grade = "1",
  Comment = "Your plea confused me immensely. Take these coins as a consolation.",
}

function GeneratePromptSysOnly(systemPrompt)
  return [[<|system|>
]] .. systemPrompt .. [[<|end|>
]]
end

function GeneratePromptUserOnly(userPrompt)
  return [[<|user|>
]] .. userPrompt .. [[<|end|>
]]
end

function GeneratePromptAssistant()
  return [[<|assistant|>]]
end

function SetupPrompt()
  local initialPrompt = GeneratePromptSysOnly(CommentSystemPrompt)
  print("Initial Prompt: " .. initialPrompt)
  Llama.setPrompt(initialPrompt)
end

function CommentPetition(userPrompt)
  local additionalPrompt = GeneratePromptUserOnly(userPrompt) .. GeneratePromptAssistant()
  print("Additional Prompt: " .. additionalPrompt)
  Llama.add(additionalPrompt)

  local comment = nil

  local commentBuilder = ""
  for i = 1, CommentMaxResponse do
    commentBuilder = commentBuilder .. Llama.next()
    comment = string.match(commentBuilder, "(.*)<|end|>.*")
    -- or string.match(commentBuilder, "(.*%w.*)\n.*")
    -- or string.match(commentBuilder, "(.*)<|user|>.*")
    -- or string.match(commentBuilder, "(.*)<|assistant|>.*")
    -- or string.match(commentBuilder, "(.*)<|system|>.*")

    if comment then break end
  end

  if not comment or string.len(comment) < 3 then
    print("No comment in: " .. commentBuilder)
    return DefaultResponse.Comment
  end

  return comment
end

function GradeComment()
  -- Utilize the state of the Llama model to generate a grade
  local additionalPrompt = GeneratePromptSysOnly(GradeSystemPrompt) .. GeneratePromptAssistant()
  print("Additional Prompt: " .. additionalPrompt)
  Llama.add(additionalPrompt)

  local grade = nil

  local gradeBuilder = ""
  for i = 1, GradeMaxResponse do
    gradeBuilder = gradeBuilder .. Llama.next()
    grade = string.match(gradeBuilder, ".*(%d).*")

    if grade then break end
  end

  return grade or DefaultResponse.Grade
end

Handlers.add(
  "Init",
  Handlers.utils.hasMatchingTag("Action", "Init"),
  function(msg)
    print("Init")

    if msg.From ~= ao.id then
      return print("Init not allowed: " .. msg.From)
    end

    ModelID = msg.Tags["Model-ID"] or ModelID
    Init()
    CommentMaxResponse = msg.Tags["Max-Response"] or CommentMaxResponse
    Send({
      Target = ao.id,
      Tags = {
        Action = "Inference-Reset-Prompt",
      }
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

    local userPrompt = msg.Data
    local comment = CommentPetition(userPrompt)

    -- Send comment preview to requester
    Send({
      Target = msg.From,
      Tags = {
        Action = "Inference-Comment",
        ["Original-Sender"] = msg.Tags["Original-Sender"],
        ["Original-Message"] = msg.Tags["Original-Message"],
      },
      Data = comment,
    })

    -- Send comment to comment handler
    Send({
      Target = ao.id,
      Tags = {
        Action = "Inference-Grade",
        ["Original-From"] = msg.From,
        ["Original-Sender"] = msg.Tags["Original-Sender"],
        ["Original-Message"] = msg.Tags["Original-Message"],
      },
      Data = comment,
    })
  end
)

Handlers.add(
  "Inference-Grade",
  Handlers.utils.hasMatchingTag("Action", "Inference-Grade"),
  function(msg)
    print("Inference-Grade")

    if msg.From ~= ao.id then
      return print("Inference-Grade not allowed: " .. msg.From)
    end

    local comment = msg.Data
    local grade = DefaultResponse.Grade

    if comment ~= DefaultResponse.Comment then
      grade = GradeComment()
    end

    print("Grade: " .. grade)

    Send({
      Target = msg.Tags["Original-From"],
      Tags = {
        Action = "Inference-Response",
        Grade = grade,
        ["Original-Sender"] = msg.Tags["Original-Sender"],
        ["Original-Message"] = msg.Tags["Original-Message"],
      },
      Data = comment,
    })

    Send({
      Target = ao.id,
      Tags = {
        Action = "Inference-Reset-Prompt",
      }
    })
  end
)

Handlers.add(
  'InferenceResetPrompt',
  Handlers.utils.hasMatchingTag('Action', 'Inference-Reset-Prompt'),
  function(msg)
    print("Inference-Reset-Prompt")

    if msg.From ~= ao.id then
      return print("Inference-Reset-Prompt not allowed: " .. msg.From)
    end

    SetupPrompt()
  end
)
