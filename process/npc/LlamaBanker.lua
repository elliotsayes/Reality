local json = require("json")
local sqlite3 = require('lsqlite3')

BankerDb = BankerDb or sqlite3.open_memory()
BankerDbAdmin = BankerDbAdmin or require('DbAdmin').new(BankerDb)

WAITLIST_PROCESS = WAITLIST_PROCESS or "TODO: WaitlistProcessId"

LLAMA_TOKEN_PROCESS = LLAMA_TOKEN_PROCESS or "TODO: LlamaTokenProcessId"
LLAMA_TOKEN_DENOMINATION = LLAMA_TOKEN_DENOMINATION or 12
LLAMA_TOKEN_MULTIPLIER = 10 ^ LLAMA_TOKEN_DENOMINATION
LLAMA_TOKEN_MIN_QUANTITY = 1 * LLAMA_TOKEN_MULTIPLIER
LLAMA_TOKEN_CAP_QUANTITY = 1 * LLAMA_TOKEN_MULTIPLIER
-- LLAMA_TOKEN_MAX_QUANTITY = 2500000000000 -- 2500 Billion

HOURLY_EMISSION_LIMIT = 100 * LLAMA_TOKEN_MULTIPLIER

MAXIMUM_PETITIONS_PER_DAY = MAXIMUM_PETITIONS_PER_DAY or 1
PETITION_COOLDOWN_MS = 23 * 60 * 60 * 1000

LLAMA_KING_PROCESS = LLAMA_KING_PROCESS or "TODO: LlamaKingProcessId"

LLAMA_FED_CHAT_PROCESS = LLAMA_FED_CHAT_PROCESS or "TODO: ChatProcessId"

--#region Initialization

SQLITE_TABLE_AUTHORISED = [[
  CREATE TABLE IF NOT EXISTS Authorised (
    WalletId TEXT PRIMARY KEY,
    Timestamp INTEGER
  );
]]

SQLITE_TABLE_WAR_CREDIT = [[
  CREATE TABLE IF NOT EXISTS WarCredit (
    MessageId TEXT PRIMARY KEY,
    Timestamp INTEGER,
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
  BankerDb:exec(SQLITE_TABLE_AUTHORISED)
  BankerDb:exec(SQLITE_TABLE_WAR_CREDIT)
  BankerDb:exec(SQLITE_TABLE_EMISSIONS)
end

BankerInitialized = BankerInitialized or false
if (not BankerInitialized) then
  InitDb()
  BankerInitialized = true
end

--#endregion

function AuthoriseWallet(walletId, timestamp)
  print("Authorising: " .. walletId)
  if timestamp == nil then
    timestamp = 0
  end
  local stmt = BankerDb:prepare("INSERT INTO Authorised (WalletId, Timestamp) VALUES (?, ?)")
  stmt:bind_values(walletId, timestamp)
  stmt:step()
  stmt:finalize()
end

function UnauthoriseWallet(walletId)
  print("Unauthorising: " .. walletId)
  local stmt = BankerDb:prepare("DELETE FROM Authorised WHERE WalletId = ?")
  stmt:bind_values(walletId)
  stmt:step()
  stmt:finalize()
end

Handlers.add(
  "Authorise",
  Handlers.utils.hasMatchingTag("Action", "Authorise"),
  function(msg)
    print("Authorise")
    if msg.From ~= WAITLIST_PROCESS then
      return print("Authorise not from WaitlistProcessId")
    end

    local walletId = msg.Tags.WalletId

    -- Check if already Authorized
    local authorised = BankerDbAdmin:exec(
      "SELECT * FROM Authorised WHERE WalletId = '" .. walletId .. "'"
    )
    if (#authorised > 0) then
      return print("Already Authorised: " .. walletId)
    end

    AuthoriseWallet(walletId, msg.Timestamp)
  end
)

function IsAuthorised(walletId)
  local authorised = BankerDbAdmin:exec(
    "SELECT * FROM Authorised WHERE WalletId = '" .. walletId .. "'"
  )
  return #authorised > 0
end

function ValidateLlamaQuantity(quantity)
  return quantity ~= nil
      and quantity >= LLAMA_TOKEN_MIN_QUANTITY
      and quantity <= LLAMA_TOKEN_CAP_QUANTITY
end

function ValidateSenderName(senderName)
  return senderName ~= nil
      and utf8.len(senderName) > 0
      and utf8.len(senderName) <= 20
end

function ValidatePetition(petition)
  return petition ~= nil
      and utf8.len(petition) > 0
      and utf8.len(petition) <= 250
end

Handlers.add(
  "CreditNoticeHandler",
  Handlers.utils.hasMatchingTag("Action", "Credit-Notice"),
  function(msg)
    -- print("CreditNoticeHandler")
    if msg.From ~= LLAMA_TOKEN_PROCESS then
      return print("Credit Notice not from $LLAMA")
    end

    -- Sender is from a trusted process
    local sender = msg.Tags.Sender
    if IsAuthorised(sender) ~= true then
      print("Sender not Authorised: " .. sender)
      Send({
        Target = LLAMA_FED_CHAT_PROCESS,
        Tags = {
          Action = 'ChatMessage',
          ['Author-Name'] = 'Llama Banker',
        },
        Data = 'Who in Llama\'s name is ' .. sender .. '!? ' ..
            ' Security! Seize this imposter!',
      })
      return
    end

    local messageId = msg.Id

    local quantity = tonumber(msg.Tags.Quantity)
    if not ValidateLlamaQuantity(quantity) then
      return print("Invalid quantity")
    end

    local senderName = msg.Tags['X-Sender-Name']
    if not ValidateSenderName(senderName) then
      return print("Invalid sender name")
    end

    local petition = msg.Tags['X-Petition']
    if not ValidatePetition(petition) then
      return print("Invalid petition: " .. (petition or '<nil>'))
    end

    -- Check last day credits in Db
    -- Sender is generated from a trusted process
    local lastDayCredits = BankerDbAdmin:exec(
      "SELECT * FROM WarCredit WHERE Sender = '" .. sender
      .. "' AND Timestamp > " .. (msg.Timestamp - PETITION_COOLDOWN_MS)
      .. " ORDER BY Timestamp DESC"
    )
    print("Last day credits: " .. #lastDayCredits)
    if (#lastDayCredits >= MAXIMUM_PETITIONS_PER_DAY) then
      -- Return $LLAMA to sender
      Send({
        Target = LLAMA_TOKEN_PROCESS,
        Tags = {
          Action = 'Transfer',
          Recipient = msg.Tags.Sender,
          Quantity = msg.Tags.Quantity,
        },
      })
      -- Write in chat
      Send({
        Target = LLAMA_FED_CHAT_PROCESS,
        Tags = {
          Action = 'ChatMessage',
          Recipient = sender,
          ['Author-Name'] = 'Llama Banker',
        },
        Data = 'Sorry ' ..
            (senderName or sender) ..
            ', but you can only petition the Llama King ' ..
            tostring(MAXIMUM_PETITIONS_PER_DAY) .. ' times per day!' ..
            ' But don\'t worry, I\'ll return your ' .. FormatLlamaTokenAmount(quantity) .. ' $LLAMA to you 🦙🤝🪙' ..
            ' Come back and try again tomorrow!',
      })
      return -- Don't save to db or forward to the Llama King
    end

    -- Save metadata
    local stmt = BankerDb:prepare(
      "INSERT INTO WarCredit (MessageId, Timestamp, Sender, Quantity) VALUES (?, ?, ?, ?)"
    )
    stmt:bind_values(messageId, msg.Timestamp, sender, quantity)
    stmt:step()
    stmt:finalize()

    -- Dispatch to the LlamaKing
    Send({
      Target = LLAMA_KING_PROCESS,
      Tags = {
        Action = 'Petition',
        ['Original-Sender'] = sender,
        ['Original-Sender-Name'] = senderName,
        ['Original-Message'] = messageId,
      },
      Data = petition,
    })

    -- Write in Chat
    Send({
      Target = LLAMA_FED_CHAT_PROCESS,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'Llama Banker',
      },
      Data = 'The court acknowledges an offering of ' ..
          FormatLlamaTokenAmount(quantity) .. ' $LLAMA from ' .. (senderName or sender) .. '!' ..
          ' This is petition ' ..
          tostring(#lastDayCredits + 1) .. ' out of ' .. MAXIMUM_PETITIONS_PER_DAY .. ' from your allowance for today.',
    })
  end
)

function CalculateBaseEmissions(currentTime)
  local totalHourlyEmissions = BankerDbAdmin:exec(
    "SELECT SUM(Amount) as Value FROM Emissions WHERE Timestamp > " .. currentTime - 3600
  )[1].Value or 0
  local remainingEmissions = math.max(HOURLY_EMISSION_LIMIT - totalHourlyEmissions, 0)
  local baseEmissions = remainingEmissions / 10
  return baseEmissions
end

function RecordEmissionsAndSendLlamaToken(amount, recipient, currentTime)
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
    Action = "Grant",
    Recipient = recipient,
    Quantity = tostring(amount)
  })
end

function FormatLlamaTokenAmount(amount)
  return string.format("%.1f", amount / LLAMA_TOKEN_MULTIPLIER)
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
    -- local quantityMultiplier = originalQuantity / LLAMA_TOKEN_MAX_QUANTITY

    local grade = tonumber(msg.Tags.Grade) -- 0 to 5
    -- local gradeMultiplier = grade / 10

    -- local baseEmissions = CalculateBaseEmissions(msg.Timestamp)
    -- local weightedEmissions = math.floor(baseEmissions * gradeMultiplier * quantityMultiplier)

    local gradeMultiplier = 0
    if (grade > 0) then
      local multiplierLookup = { 1, 10, 50, 100, 200 }
      gradeMultiplier = multiplierLookup[grade]
    end
    local baseEmissions = 1 * LLAMA_TOKEN_MULTIPLIER
    -- Ignoring quantityMultiplier for now
    local weightedEmissions = math.floor(baseEmissions * gradeMultiplier)

    print("Quantity: " .. originalQuantity .. ", Grade: " .. grade .. ", Weighted Emissions: " .. weightedEmissions)

    -- TODO: Message chat / DM

    local originalSender = msg.Tags['Original-Sender']
    local originalSenderName = msg.Tags['Original-Sender-Name']
    local useSenderName = originalSenderName or originalSender

    RecordEmissionsAndSendLlamaToken(weightedEmissions, originalSender, msg.Timestamp)

    local chatMessage = 'Sorry ' ..
        useSenderName ..
        ', the king specifically requested that you receive no $LLAMA coin... maybe you could try again?'
    if (grade > 0) then
      if (weightedEmissions > 0) then
        chatMessage = 'Congratulations ' ..
            useSenderName .. ', you have been granted ' .. FormatLlamaTokenAmount(weightedEmissions) .. ' $LLAMA coins!'
      else
        chatMessage = 'I\'m sorry ' ..
            useSenderName ..
            ', but it looks like I have no more $LLAMA coins to give... maybe try again in an hour or so?'
      end
    end

    -- Write in Chat
    Send({
      Target = LLAMA_FED_CHAT_PROCESS,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'Llama Banker',
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
    -- If the user has no emissions, the token process might
    -- send the balance of the banker instead!!

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

    local message = 'Psst, you currently have ' .. FormatLlamaTokenAmount(balance) .. ' $LLAMA coins!'
    message = message .. ' Go to ao-bazar.g8way.io or permaswap.network to view and trade your ao tokens.'
    Send({
      Target = LLAMA_FED_CHAT_PROCESS,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'Llama Banker',
        Recipient = account,
      },
      Data = message,
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

function SecondsToClock(seconds)
  local seconds = tonumber(seconds)

  if seconds <= 0 then
    return "00:00:00";
  else
    hours = string.format("%02.f", math.floor(seconds / 3600));
    mins = string.format("%02.f", math.floor(seconds / 60 - (hours * 60)));
    secs = string.format("%02.f", math.floor(seconds - hours * 3600 - mins * 60));
    return hours .. ":" .. mins .. ":" .. secs
  end
end

function Schema(petitionCount, timeLeft)
  local description = ""
  if (petitionCount > 0) then
    description = "You have used " .. petitionCount .. " out of "
        .. MAXIMUM_PETITIONS_PER_DAY .. " petitions today. "
  else
    description = "You have not used any petitions today! "
  end

  if (petitionCount == MAXIMUM_PETITIONS_PER_DAY and timeLeft ~= nil) then
    description = description .. "Your next petition will be available in " .. SecondsToClock(timeLeft) .. ". "
  end

  description = description ..
      "\r\nClick Submit for Llama Banker to check your $LLAMA account and write the balance in chat."

  return {
    Balance = {
      Title = "Check your Llama Land Status!",
      Description = description
      , -- TODO: nil Descriptions?
      Schema = {
        Tags = json.decode(RequestBalanceMessageSchemaTags),
        -- Data
        -- Result?
      },
    }
  }
end

Handlers.add(
  'Schema',
  Handlers.utils.hasMatchingTag('Action', 'Schema'),
  function(msg)
    print('Schema')
    local sender = msg.From
    if IsAuthorised(sender) ~= true then
      Send({
        Target = sender,
        Tags = { Type = 'Schema' },
        Data = json.encode({
          Balance = {
            Title = "Check your Llama Land Status!",
            Description =
            "Sorry, my services are only available to Llama Land Citizens. Please talk to the Citizenship Llama if that piques your interest...",
            Schema = nil,
          }
        })
      })
    end

    local lastDayCredits = BankerDbAdmin:exec(
      "SELECT * FROM WarCredit WHERE Sender = '" .. sender
      .. "' AND Timestamp > " .. (msg.Timestamp - PETITION_COOLDOWN_MS)
      .. " ORDER BY Timestamp DESC"
    )
    local petitionCount = #lastDayCredits
    local timeLeft = nil
    if (petitionCount == MAXIMUM_PETITIONS_PER_DAY) then
      local lastCredit = lastDayCredits[#lastDayCredits]
      timeLeft = (lastCredit.Timestamp + PETITION_COOLDOWN_MS - msg.Timestamp) / 1000
    end
    print('Petition Count: ' .. petitionCount)
    print('Time Left: ' .. (timeLeft or 'nil'))

    Send({ Target = msg.From, Tags = { Type = 'Schema' }, Data = json.encode(Schema(petitionCount, timeLeft)) })
  end
)

-- PROFILE = "SNy4m-DrqxWl01YqGM4sxI8qCni-58re8uuJLvZPypY"
-- Send({ Target = PROFILE, Action = "Create-Profile", Data = '{"UserName":"Llama Banker","DateCreated":1718653250836,"DateUpdated":1718653250836,"ProfileImage":"","CoverImage":"","Description":"","DisplayName":"Llama Banker"}' })
