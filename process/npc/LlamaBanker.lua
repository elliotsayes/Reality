local json = require("json")
local sqlite3 = require('lsqlite3')

BankerDb = BankerDb or sqlite3.open_memory()
BankerDbAdmin = BankerDbAdmin or require('DbAdmin').new(BankerDb)

HOURLY_EMISSION_LIMIT = 1000000
LLAMA_TOKEN_PROCESS = "TODO: LlamaTokenProcessId"

WRAPPED_ARWEAVE_TOKEN_PROCESS = "TODO: WarProcessId"

LLAMA_KING_PROCESS = "TODO: LlamaKingProcessId"

LLAMA_FED_CHAT_PROCESS = "TODO: ChatProcessId"

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

Initialized = Initialized or false
if (not Initialized) then
  InitDb()
  Initialized = true
end

--#endregion

Handlers.add(
  "CreditNoticeHandler",
  Handlers.utils.hasMatchingTag("Action", "Credit-Notice"),
  function(msg)
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
      math.max(HOURLY_EMISSION_LIMIT, totalEmissions * 200) -- 10k
  return 100 * adjustment * grade
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

Handlers.add(
  "GradePetitionHandler",
  Handlers.utils.hasMatchingTag("Action", "Grade-Petition"),
  function(msg)
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

    -- Write in Chat
    Send({
      Target = LLAMA_FED_CHAT_PROCESS,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'LlamaBanker',
      },
      Data = 'Congratulations ' .. originalSender .. ', you have been granted ' .. weightedEmissions .. ' $LLAMA coins!',
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
    local balance = msg.Tags.Balance
    print('Account: ' .. account .. ', Balance: ' .. balance)
    -- TODO: DM ?
    Send({
      Target = LLAMA_FED_CHAT_PROCESS,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'LlamaBanker',
      },
      Data = 'Address ' .. account .. ', you currently have ' .. balance .. ' $LLAMA coins!',
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
