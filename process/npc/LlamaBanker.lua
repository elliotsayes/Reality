local json = require("json")

HOURLY_EMISSION_LIMIT = 1000000
LLAMA_TOKEN_PROCESS = "TODO: LlamaTokenProcessId"

WRAPPED_ARWEAVE_TOKEN_PROCESS = "TODO: WarProcessId"

LLAMA_KING_PROCESS = "TODO: LlamaKingProcessId"

-- Map<CreditNoticeMessageId, CreditNotice>
WAR_CREDIT_HISTORY = {
  -- ['msgId'] = {
  --   Sender = 'SomeTxId',
  --   Quantity = 100,
  -- }
}

Handlers.add(
  "CreditNoticeHandler",
  Handlers.utils.hasMatchingTag("Action", "Credit-Notice"),
  function(msg)
    if msg.From ~= WRAPPED_ARWEAVE_TOKEN_PROCESS then
      return print("Credit Notice not from $wAR")
    end

    local messageId = msg.Id
    local sender = msg.Tags.Sender
    local quantity = msg.Tags.Quantity
    local petition = msg.Tags['X-Petition']

    -- Save metadata
    WAR_CREDIT_HISTORY[messageId] = {
      Sender = sender,
      Quantity = quantity,
    }

    -- Dispatch to the LlamaKing
    Send({
      Target = LLAMA_KING_PROCESS,
      Tags = {
        Action = 'Petition',
        ['Original-Sender'] = sender,
        ['Original-Message'] = messageId,
      },
      Data = petition,
    })
  end
)

EMISSIONS = {}

function CalculateBaseEmissions(grade, currentTime)
  local totalEmissions = 0
  for i, emission in ipairs(EMISSIONS) do
    if currentTime - emission.timestamp <= 3600 then
      totalEmissions = totalEmissions + emission.amount
    end
  end
  local adjustment = HOURLY_EMISSION_LIMIT /
      math.max(HOURLY_EMISSION_LIMIT, totalEmissions * 200) -- 10k
  return 100 * adjustment * grade
end

function SendLlamaToken(amount, recipient, currentTime)
  ao.send({
    Target = LLAMA_TOKEN_PROCESS,
    Action = "Transfer",
    Recipient = recipient,
    Quantity = tostring(amount)
  })
  table.insert(EMISSIONS, {
    amount = amount,
    recipient = recipient,
    timestamp = currentTime
  })
end

Handlers.add(
  "GradePetitionHandler",
  Handlers.utils.hasMatchingTag("Action", "Grade-Petition"),
  function(msg)
    if msg.From ~= LLAMA_KING_PROCESS then
      return print("Petition not from LlamaKing")
    end
    local originalMessageId = msg['Original-Message']
    if WAR_CREDIT_HISTORY[originalMessageId] == nil then
      return print("Credit not found")
    end

    local originalSender = msg['Original-Sender']
    local originalQuantity = WAR_CREDIT_HISTORY[originalMessageId].Quantity

    local grade = msg.Tags.Grade

    local baseEmissions = CalculateBaseEmissions(grade, msg.Timestamp)
    local weightedEmissions = baseEmissions * originalQuantity

    -- TODO: Message chat / DM

    SendLlamaToken(weightedEmissions, originalSender, msg.Timestamp)
  end
)

Handlers.add(
  'RequestBalanceMessage',
  Handlers.utils.hasMatchingTag('Action', 'RequestBalanceMessage'),
  function(msg)
    print('RequestBalanceMessage')
    Send({
      Target = LLAMA_TOKEN_PROCESS,
      Tags = {
        Action = 'Balance',
        Recipient = msg.From,
      },
    })
  end
)

Handlers.add(
  'TokenBalanceResponse',
  function(msg)
    local fromToken = msg.From == LLAMA_TOKEN_PROCESS
    local hasBalance = msg.Tags.Balance ~= nil
    return fromToken and hasBalance
  end,
  function(msg)
    print('TokenBalanceResponse')
    local account = msg.Tags.Account
    local balance = msg.Tags.Balance
    print('Account: ' .. account .. ', Balance: ' .. balance)
    -- TODO: Put the balance in the chat / DM
  end
)

function clearOldEmissions(currentTime)
  for i = #EMISSIONS, 1, -1 do
    if currentTime - EMISSIONS[i].timestamp > 6 * 3600 then
      table.remove(EMISSIONS, i)
    end
  end
end

Handlers.add(
  "CronHandler",
  Handlers.utils.hasMatchingTag("Action", "Cron-Tick"),
  function(msg)
    clearOldEmissions(msg.Timestamp)
  end
)

-- Declare Schema for UI

RequestBalanceMessageSchemaTags = [[
{
  "type": "object",
  "required": [
    "Action",
  ],
  "properties": {
    "Action": {
      "type": "string",
      "const": "RequestBalanceMessage"
    }
  }
}
]]

Schema = {
  RequestBalanceMessage = {
    Title = "Check your $LLAMA Balance",
    Description = "", -- TODO: nil Descriptions?
    Schema = {
      Tags = json.decode(RequestBalanceMessageSchemaTags),
      -- Data
      -- Result?
    },
  },
}

Handlers.add(
  'Schema',
  Handlers.utils.hasMatchingTag('Read', 'Schema'),
  function(msg)
    print('Schema')
    Send({ Target = msg.From, Tags = { Type = 'Schema' }, Data = json.encode(Schema) })
  end
)
