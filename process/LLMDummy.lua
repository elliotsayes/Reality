local responseLookup = {
  "Terrible, you should be ashamed of yourself.",
  "You should be embarrassed.",
  "Almost worthless",
  "Not good enough",
  "You can do better",
  "Not bad",
  "Good job",
  "Great job",
  "Excellent work",
  "Absolutely Perfect!",
}

function ProcessPetition(systemPrompt, userPrompt)
  -- Random grade 1-10
  local gradeNumber = math.random(1, 10)
  return tostring(gradeNumber), responseLookup[gradeNumber]
end

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
