local json = require("json")
local sqlite3 = require('lsqlite3')

BankerDb = BankerDb or sqlite3.open_memory()
BankerDbAdmin = BankerDbAdmin or require('DbAdmin').new(BankerDb)

LLAMA_TOKEN_PROCESS = LLAMA_TOKEN_PROCESS or "TODO: LlamaTokenProcessId"
LLAMA_TOKEN_DENOMINATION = LLAMA_TOKEN_DENOMINATION or 12
LLAMA_TOKEN_MULTIPLIER = 10 ^ LLAMA_TOKEN_DENOMINATION

HOURLY_EMISSION_LIMIT = 100 * LLAMA_TOKEN_MULTIPLIER

WRAPPED_ARWEAVE_TOKEN_PROCESS = WRAPPED_ARWEAVE_TOKEN_PROCESS or "TODO: WarProcessId"

LLAMA_KING_PROCESS = LLAMA_KING_PROCESS or "TODO: LlamaKingProcessId"

LLAMA_FED_CHAT_PROCESS = LLAMA_FED_CHAT_PROCESS or "TODO: ChatProcessId"

--#region Initialization

SQLITE_TABLE_WAR_CREDIT = [[
  CREATE TABLE IF NOT EXISTS WarCredit (
    MessageId TEXT PRIMARY KEY,
    Sender TEXT,
    Quantity INTEGER
  );
]]

SQLITE_TABLE_EMISSIONS = [[
  CREATE TABLE IF NOT EXISTS Emissions (
    Amount INTEGER,
    Recipient TEXT,
    Timestamp INTEGER
  );
]]

function InitDb()
  BankerDb:exec(SQLITE_TABLE_WAR_CREDIT)
  BankerDb:exec(SQLITE_TABLE_EMISSIONS)
end

ChatInitialized = ChatInitialized or false
if (not ChatInitialized) then
  InitDb()
  ChatInitialized = true
end

--#endregion

Handlers.add(
  "CreditNoticeHandler",
  Handlers.utils.hasMatchingTag("Action", "Credit-Notice"),
  function(msg)
    -- print("CreditNoticeHandler")
    if msg.From ~= WRAPPED_ARWEAVE_TOKEN_PROCESS then
      return print("Credit Notice not from $wAR")
    end

    local messageId = msg.Id
    local sender = msg.Tags.Sender
    local senderName = msg.Tags['X-Sender-Name']
    local quantity = tonumber(msg.Tags.Quantity)
    local petition = msg.Tags['X-Petition']

    -- Save metadata
    BankerDb:exec(
      string.format(
        "INSERT INTO WarCredit (MessageId, Sender, Quantity) VALUES ('%s', '%s', %d)",
        messageId,
        sender,
        quantity
      )
    )

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

    -- Write in Chat
    Send({
      Target = LLAMA_FED_CHAT_PROCESS,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'LlamaBanker',
      },
      Data = 'Received ' .. quantity .. ' $wAR from ' .. (senderName or sender),
    })
  end
)

function CalculateBaseEmissions(grade, currentTime)
  -- TODO, fix this algo
  local totalEmissions = BankerDbAdmin:exec(
    "SELECT SUM(Amount) as Value FROM Emissions WHERE Timestamp > " .. currentTime - 3600
  )[1].Value or 0
  local adjustment = HOURLY_EMISSION_LIMIT /
      math.max(HOURLY_EMISSION_LIMIT, totalEmissions * 2 * LLAMA_TOKEN_MULTIPLIER) -- 10k
  return LLAMA_TOKEN_MULTIPLIER * adjustment * grade
end

function SendLlamaToken(amount, recipient, currentTime)
  BankerDbAdmin:exec(
    string.format(
      "INSERT INTO Emissions (Amount, Recipient, Timestamp) VALUES (%d, '%s', %d)",
      amount,
      recipient,
      currentTime
    )
  )
  ao.send({
    Target = LLAMA_TOKEN_PROCESS,
    Action = "Transfer",
    Recipient = recipient,
    Quantity = tostring(amount)
  })
end

function FormatLlamaTokenAmount(amount)
  return string.format("%.2f", amount / LLAMA_TOKEN_MULTIPLIER)
end

Handlers.add(
  "GradePetitionHandler",
  Handlers.utils.hasMatchingTag("Action", "Grade-Petition"),
  function(msg)
    -- print("GradePetitionHandler")
    if msg.From ~= LLAMA_KING_PROCESS then
      return print("Petition not from LlamaKing")
    end
    local originalMessageId = msg['Original-Message']
    local creditEntries = BankerDbAdmin:exec(
      "SELECT * FROM WarCredit WHERE MessageId = '" .. originalMessageId .. "'"
    )
    if (#creditEntries == 0) then
      return print("Credit not found")
    end
    local originalQuantity = creditEntries[1].Quantity

    local grade = tonumber(msg.Tags.Grade)

    local baseEmissions = CalculateBaseEmissions(grade, msg.Timestamp)
    local weightedEmissions = math.floor(baseEmissions * originalQuantity)

    -- TODO: Message chat / DM

    local originalSender = msg.Tags['Original-Sender']
    SendLlamaToken(weightedEmissions, originalSender, msg.Timestamp)

    local chatMessage = 'Sorry ' ..
        originalSender ..
        ', the king specifically requested that you receive no $LLAMA coin... maybe you could try again?'
    if (weightedEmissions > 0) then
      chatMessage = 'Congratulations ' ..
          originalSender .. ', you have been granted ' .. FormatLlamaTokenAmount(weightedEmissions) .. ' $LLAMA coins!'
    end

    -- Write in Chat
    Send({
      Target = LLAMA_FED_CHAT_PROCESS,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'LlamaBanker',
      },
      Data = chatMessage,
    })
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
    -- print('TokenBalanceResponse')
    local account = msg.Tags.Account
    local balance = tonumber(msg.Tags.Balance)
    print('Account: ' .. account .. ', Balance: ' .. balance)
    -- TODO: DM ?
    Send({
      Target = LLAMA_FED_CHAT_PROCESS,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'LlamaBanker',
      },
      Data = 'Address ' .. account .. ', you currently have ' .. FormatLlamaTokenAmount(balance) .. ' $LLAMA coins!',
    })
  end
)

-- Handlers.add(
--   "CronHandler",
--   Handlers.utils.hasMatchingTag("Action", "Cron-Tick"),
--   function(msg)
--     clearOldEmissions(msg.Timestamp)
--   end
-- )

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
