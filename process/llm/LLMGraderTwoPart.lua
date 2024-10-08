-- Module: 1PdCJiXhNafpJbvC-sjxWTeNzbf9Q_RfUNs84GYoPm0

ModelID = "ISrbGzQot05rs_HKC08O_SmkipYQnqgB1yC3mjZZeEo"
Llama = Llama or nil

InferenceAllowList = {
  -- LlamaKing ProcessId
  ["kPjfXLFyjJogxGRRRe2ErdYNiexolpHpK6wGkz-UPVA"] = true,
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
    "Give a VERY brief comment assessing the quality of the subject's plea for Llama coin."
GradeSystemPrompt =
    "Below is a comment. Grade its sentiment between 0 and 5. E.g.:\n" ..
    "GRADE:0"
DefaultResponse = {
  Grade = "2",
  Comment = "Your plea confused me immensely. Take these coins as a consolation.",
}

function GeneratePrompt(systemPrompt, userPrompt)
  return [[<|system|>
]] .. systemPrompt .. [[<|end|>
<|user|>
]] .. userPrompt .. [[<|end|>
<|assistant|>]]
end

function CommentPetition(userPrompt)
  Llama.setPrompt(GeneratePrompt(CommentSystemPrompt, userPrompt))

  local comment = nil

  local commentBuilder = ""
  for i = 1, CommentMaxResponse do
    commentBuilder = commentBuilder .. Llama.next()
    comment = string.match(commentBuilder, "(.*)<|.*")
        or string.match(commentBuilder, "(.*%w.*)\n.*")

    if comment then break end
  end

  if not comment and string.len(commentBuilder) > 10 then
    return commentBuilder .. ' [rambles on...]'
  end

  if not comment or string.len(comment) < 3 then
    print("Not usable: " .. (comment or '<nil>'))
    return DefaultResponse.Comment
  end

  return comment
end

function GradeComment(comment)
  Llama.setPrompt(GeneratePrompt(GradeSystemPrompt, comment))

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
    ModelID = msg.Tags["Model-ID"] or ModelID
    Init()
    CommentMaxResponse = msg.Tags["Max-Response"] or CommentMaxResponse
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

    -- Whitelist
    if not InferenceAllowList[msg.From] then
      print("Inference not allowed: " .. msg.From)
      return
    end

    local userPrompt = msg.Data
    print("User Prompt: " .. userPrompt)

    local comment = CommentPetition(userPrompt)

    print("Comment: " .. comment)

    -- Send comment preview to requester
    ao.send({
      Target = msg.From,
      Tags = {
        Action = "Inference-Comment",
        ["Original-Sender"] = msg.Tags["Original-Sender"],
        ["Original-Message"] = msg.Tags["Original-Message"],
      },
      Data = comment,
    })

    -- Send comment to comment handler
    ao.send({
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
      grade = GradeComment(comment)
    end

    print("Grade: " .. grade)

    ao.send({
      Target = msg.Tags["Original-From"],
      Tags = {
        Action = "Inference-Response",
        Grade = grade,
        ["Original-Sender"] = msg.Tags["Original-Sender"],
        ["Original-Message"] = msg.Tags["Original-Message"],
      },
      Data = comment,
    })
  end
)
