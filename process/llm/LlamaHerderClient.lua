-- Llama Herder Client
local M = {}

M.herder = M.herder or "wh5vB2IbqmIBUqgodOaTvByNFDPr73gbUq1bVOUtCrw"
M.token = M.token or "xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10"

M.feeBase = M.feeBase or 0
M.feeToken = M.feeToken or 0
M.lastMultiplier = M.lastMultiplier or 0
M.queueLength = M.queueLength or 0
M.feeBump = M.feeBump or 1.005 -- Increase the fee on the prior base by 0.5%
M.infoCallback = M.infoCallback or nil
M.inferenceCallbacks = M.inferenceCallbacks or {}
M.printResponses = M.printResponses or true
M.Reference = M.Reference or 0

function M.getPrices(...)
  ao.send({ Target = M.herder, Action = "Info" })

  if select("#", ...) == 1 then
    M.infoCallback = select(1, ...)
  end
end

function M.calculateFee(prompt, tokens)
  if M.feeBase == 0 then
    print("LlamaHerder: No base fee found. Get prices before calculating.")
    return
  end

  local tokenCount = tokens
  for _ in string.gmatch(prompt, "%w+") do
    tokenCount = tokenCount + 1
  end

  return M.feeBase + M.feeToken * tokenCount
end

function M.run(...) -- prompt, tokens, callback, fees, customReference
  local args = { ... }

  if M.feeBase == 0 and not (select(4, ...) and select(4, ...).Fee) then
    -- We don't know the fees and we aren't using a static one.
    -- So we need to get the fees from the herder, then run the request again.
    if M.infoCallback then
      local oldCallback = M.infoCallback
      M.infoCallback =
          function()
            M.run(table.unpack(args))
            oldCallback()
          end
    else
      M.getPrices(function() M.run(table.unpack(args)) end)
    end
    return
  end

  local prompt = select(1, ...)
  local tokens = select(2, ...)
  local callback = select(3, ...)
  local fees = select(4, ...)
  local customReference = select(5, ...)

  local reference = customReference or tostring(M.Reference)

  local msg = {
    Target = M.token,
    Action = "Transfer",
    Recipient = M.herder,
    ["X-Reference"] = reference,
    ["X-Prompt"] = prompt,
    ["X-Tokens"] = tostring(tokens)
  }

  local fee = M.calculateFee(prompt, tokens) * M.lastMultiplier

  if M.queueLength > 0 then
    fee = fee * M.feeBump
  end

  -- Apply custom fee rules, if provided.
  if fees then
    if fees.Fee then
      fee = fees.Fee
    end
    if fees.Multiplier then
      fee = fee * fees.Multiplier
    end
  end

  msg.Quantity = tostring(math.floor(fee))
  M.lastFeePaid = fee

  if callback then
    M.inferenceCallbacks[reference] = callback
  end

  ao.send(msg)
  M.Reference = M.Reference + 1
end

Handlers.add(
  "LlamaHerder.Info-Response",
  function(msg)
    return msg.From == M.herder and
        msg.Action == "Info-Response"
  end,
  function(msg)
    print("LlamaHerder: Handling new price info...")
    M.feeBase = tonumber(msg["Base-Fee"])
    M.feeToken = tonumber(msg["Token-Fee"])
    M.lastMultiplier = tonumber(msg["Last-Multiplier"])
    M.queueLength = tonumber(msg["Queue-Length"])

    if M.infoCallback then
      M.infoCallback()
      M.infoCallback = nil
    end
  end
)

Handlers.add(
  "LlamaHerder.Inference-Response",
  function(msg)
    return msg.From == M.herder and
        msg.Action == "Inference-Response"
  end,
  function(msg)
    local reference = msg["X-Reference"]

    if M.inferenceCallbacks[reference] then
      M.inferenceCallbacks[reference](msg.Data, msg)
      M.inferenceCallbacks[reference] = nil
    else
      if M.printResponses then
        print("LlamaHerder response: " .. msg.Data)
      end
    end
  end
)

return M
