-- Configure this to the process ID of the world you want to send chat messages to
CHAT_TARGET = '9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss'
LLAMA_TOKEN_PROCESS = 'pazXumQI-HPH7iFGfTC-4_7biSnqz_U67oFAGry5zUY'
ADMIN_ADDRESS = 'jSi6j6uTthM2xIZfAFmirxbvGo0tskDsGavrrnj5qVY'

-- Configure this to the process ID of the world you want to send chat messages to

local json = require('json')
local sqlite3 = require('lsqlite3')

LLAMA_TOKEN_DENOMINATION = 12
LLAMA_TOKEN_MULTIPLIER = 10 ^ LLAMA_TOKEN_DENOMINATION
MIN_BET = 1
MAX_BET = 10
MIN_BET_QUANTITY = MIN_BET * LLAMA_TOKEN_MULTIPLIER
MAX_BET_QUANTITY = MAX_BET * LLAMA_TOKEN_MULTIPLIER

CACHE_PROCESS_BALANCE = 0

function RefreshProcessBalance()
  Send({
    Target = LLAMA_TOKEN_PROCESS,
    Tags = {
      Action = 'Balance',
      Account = ao.id,
    },
  })
end

RefreshProcessBalance()

JokerDb = JokerDb or sqlite3.open_memory()
JokerDbAdmin = JokerDbAdmin or require('DbAdmin').new(JokerDb)

SQLITE_TABLE_LLAMA_CREDIT = [[
  CREATE TABLE IF NOT EXISTS LlamaCredit (
    MessageId TEXT PRIMARY KEY,
    Timestamp INTEGER,
    Sender TEXT,
    Quantity INTEGER,
    Choice TEXT,
    Refunded INTEGER DEFAULT 0
  );
]]

function InitDb()
  JokerDb:exec(SQLITE_TABLE_LLAMA_CREDIT)
end

JokerInitialized = JokerInitialized or false
if (not JokerInitialized) then
  InitDb()
  JokerInitialized = true
end



function FormatLlamaTokenAmount(amount)
  return string.format("%.2f", amount / LLAMA_TOKEN_MULTIPLIER)
end

function DispatchJokeMessage(jokeTopic)
  print("DispatchJokeMessage")
  local systemPrompt = "Tell a joke on the given topic, on one line"
  local prompt = [[<|system|>
]] .. systemPrompt .. [[<|end|>
<|user|>
Topic: ]] .. jokeTopic .. [[<|end|>
<|assistant|>
]]
  print(prompt)
  Llama.run(
    prompt,
    40,
    HandleJoke
  )
end

Handlers.add(
  "CreditNoticeHandler",
  Handlers.utils.hasMatchingTag("Action", "Credit-Notice"),
  function(msg)
    -- print("CreditNoticeHandler")
    if msg.From ~= LLAMA_TOKEN_PROCESS then
      return print("Credit Notice not from $LLAMA")
    end
    print('Credit Notice triggered from: ' .. msg.From .. ', tags: ' .. json.encode(msg.Tags) .. ', data: ' .. msg.Data)

    -- Sender is from a trusted process
    local sender = msg.Tags.Sender
    local messageId = msg.Id
    local topic = msg.Tags['X-JokeTopic']

    local quantity = tonumber(msg.Tags.Quantity)
    if not ValidateBetQuantity(quantity) then
      Send({
        Target = CHAT_TARGET,
        Tags = {
          Action = 'ChatMessage',
          ['Author-Name'] = 'Oracle Llama',
          Recipient = sender,
        },
        Data = "Invalid quantity, the ancient llama spirits are displeased, the quantity must between " ..
            MIN_BET .. " and " .. MAX_BET .. " $LLAMA",
      })
      RefundBet(sender, quantity)
      return print("Invalid quantity")
    end

    local jokeTopic = msg.Tags['X-JokeTopic']
    print(jokeTopic)
    if not ValidateChoice(jokeTopic) then
      return print("Invalid vote")
    end

    -- Save metadata
    local stmt = JokerDb:prepare [[
      INSERT INTO LlamaCredit
      (MessageId, Timestamp, Sender, Quantity, Choice)
      VALUES (?, ?, ?, ?, ?)
    ]]
    stmt:bind_values(messageId, msg.Timestamp, sender, quantity, jokeTopic)
    stmt:step()
    stmt:finalize()


    -- Write in Chat
    Send({
      Target = CHAT_TARGET,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'Oracle Llama',
        Recipient = sender,
      },
      Data =
      "High or Low, good question~ The spirits of the ancient llamas whisper... but they're a bit hoarse today. Ah, I see you seek the wisdom of High and Low. Let me consult my crystal hay bale...",
    })

    if topic then
      if not ValidateBetQuantity(quantity) or not ValidateChoice(topic) then
        print('Refunded bet')
        RefundBet(sender, quantity)
        return
      end
      print('Processed game')
      ProcessGame(sender, quantity, topic)
    end
  end
)


function BetSchemaTags()
  return [[
{
"type": "object",
"required": [
  "Action",
  "Recipient",
  "Quantity",
  "X-JokeTopic"
],
"properties": {
  "Action": {
    "type": "string",
    "const": "Transfer"
  },
  "Recipient": {
    "type": "string",
    "const": "]] .. ao.id .. [["
  },
  "Quantity": {
    "type": "number",
    "default": ]] .. MIN_BET .. [[,
    "minimum": ]] .. MIN_BET .. [[,
    "maximum": ]] .. MAX_BET .. [[,
    "title": "$LLAMA cost (]] .. MIN_BET .. [[-]] .. MAX_BET .. [[)",
    "$comment": "]] .. LLAMA_TOKEN_MULTIPLIER .. [["
  },
  "X-JokeTopic": {
    "type": "string",
    "enum": ["High", "Low"],
    "title": "Choose High or Low",
  }
}
}
]]
end

function AdminchemaTags()
  return [[
{
"type": "object",
"required": [
  "Action",
  "Quantity",
  "Recipient",
],
"properties": {
  "Action": {
    "type": "string",
    "const": "AdminAction"
  },
  "Recipient": {
    "type": "string",
    "const": "]] .. ao.id .. [["
  },
  "Quantity": {
    "type": "number",
    "default": ]] .. MIN_BET .. [[,
    "title": "$LLAMA cost (]] .. MIN_BET .. [[)",
    "$comment": "]] .. LLAMA_TOKEN_MULTIPLIER .. [["
  },
}
}
]]
end

Handlers.add(
  'TokenBalanceResponse',
  function(msg)
    local fromToken = msg.From == LLAMA_TOKEN_PROCESS
    local hasBalance = msg.Tags.Balance ~= nil
    return fromToken and hasBalance
  end,
  function(msg)
    local account = msg.Tags.Account
    local balance = tonumber(msg.Tags.Balance)
    local isAdmin = account == ADMIN_ADDRESS
    print('Account: ' .. account .. ', Balance: ' .. FormatLlamaTokenAmount(balance))
    if account == ao.id then
      CACHE_PROCESS_BALANCE = balance
    end
    if isAdmin then
      RefreshProcessBalance()
      Send({
        Target = account,
        Tags = { Type = 'AdminAction' },
        Data = json.encode({
          AskOracleLlama = {
            Target = ao.id,
            Title = "Admin Withdraw",
            Description = string.format(
              "Pool balance: %s $LLAMA\n", FormatLlamaTokenAmount(CACHE_PROCESS_BALANCE)
            ),
            Schema = {
              Tags = json.decode(AdminchemaTags()),
            }
          },
        })
      })
    elseif (balance >= (MIN_BET_QUANTITY)) then
      Send({
        Target = account,
        Tags = { Type = 'SchemaExternal' },
        Data = json.encode({
          AskOracleLlama = {
            Target = LLAMA_TOKEN_PROCESS,
            Title =
            "Welcome to Madame Baa-Baa's Wooly Wisdom Hut!",
            Description = string.format(
              "I'm the Ovine Oracle, seer of Highs and Lows. Peer into my mystic eyes (rectangular pupils? Pure flair!) and test your fleece-tiny! Will you scale Ewe-verest or tumble into Shear Despair? Make a wish, brave lambkin - may ancient sheep spirits guide you! \nYour balance: %s $LLAMA\n",
              FormatLlamaTokenAmount(balance)
            ),
            Schema = {
              Tags = json.decode(BetSchemaTags()),
              -- Data
              -- Result?
            },
          },
        })
      })
    else
      Send({
        Target = account,
        Tags = { Type = 'SchemaExternal' },
        Data = json.encode({
          AskOracleLlama = {
            Target = LLAMA_TOKEN_PROCESS,
            Title = "Insufficient Balance",
            Description = string.format(
              "Alas, young seeker! The mystical forces reveal that your cosmic $LLAMA reserves are running low. The ancient scrolls decree a minimum offering of %s $LLAMA to unlock the secrets of fate, but your astral wallet shows a mere %s $LLAMA.\n\n" ..
              "Fear not! To replenish your spiritual coffers, seek out the benevolent Llama Giver, or perform the sacred ritual of 'asking a friend'. Remember, in the grand tapestry of the universe, there's no shame in a little celestial charity!",
              FormatLlamaTokenAmount(MIN_BET), FormatLlamaTokenAmount(balance)
            ),
            Schema = nil,
          },
        })
      })
    end
  end
)

function RefundBet(sender, quantity)
  Send({
    Target = LLAMA_TOKEN_PROCESS,
    Tags = {
      Action = 'Transfer',
      Recipient = sender,
      Quantity = tostring(quantity),
    },
  })
  SendErrorMessage(sender,
    string.format(
      "Oh dear %s! The cosmic scales reject your offering! It seems your bet has angered the ancient llama spirits. Fear not, for they are merciful and have decreed a full refund. Perhaps try again with a number that doesn't make them spit?",
      tostring(sender)))
end

function ValidateBetQuantity(quantity)
  local res = quantity ~= nil and quantity >= MIN_BET_QUANTITY and quantity <= MAX_BET_QUANTITY
  print('Quantity is ' ..
    tostring(FormatLlamaTokenAmount(quantity)) .. ', ValidateBetQuantity result is ' .. tostring(res))
  return res
end

function ValidateChoice(choice)
  local res = choice == 'High' or choice == 'Low'
  print('choice is ' .. tostring(choice) .. ', ValidateChoice result is ' .. tostring(res))
  return res
end

function ProcessGame(sender, betAmount, choice)
  local result = math.random() < 0.5 and "High" or "Low"
  local won = result == choice
  local resultMessage
  print('Result: ' .. result .. ', Choice: ' .. choice .. ', Won: ' .. tostring(won))
  print('Bet amount: ' .. FormatLlamaTokenAmount(betAmount))
  print('Sender: ' .. sender)
  if won then
    local winAmount = math.floor(betAmount * 1.5) -- 50% profit
    resultMessage = string.format(
      "%s, By the whiskers of the great llama in the sky! Your clairvoyance rivals my own! You wagered %s $LLAMA on the mystical path of %s, and the universe has smiled upon you with a bountiful %s $LLAMA! Quick, buy a lottery ticket before your luck runs out!",
      sender, FormatLlamaTokenAmount(betAmount), choice, FormatLlamaTokenAmount(winAmount))
    Send({
      Target = LLAMA_TOKEN_PROCESS,
      Tags = {
        Action = 'Transfer',
        Recipient = sender,
        Quantity = tostring(winAmount),
      },
    })
    print('Transfered ' .. FormatLlamaTokenAmount(winAmount) .. ' to ' .. sender)
  else
    resultMessage = string.format(
      "%s, Alas, brave soul! The fickle fingers of fate have fumbled. You offered %s $LLAMA to the altar of chance, choosing the path of %s, but the cosmic dartboard landed on %s. Don't despair! In the grand tapestry of the universe, this is but a tiny, llama-shaped hole. May your future endeavors be filled with more hay... I mean, success!",
      sender, FormatLlamaTokenAmount(betAmount), choice, result)
  end

  Send({
    Target = CHAT_TARGET,
    Tags = {
      Action = 'ChatMessage',
      ['Author-Name'] = 'Oracle Llama',
    },
    Data = resultMessage,
  })

  -- Refresh the game form for the user
  Send({
    Target = LLAMA_TOKEN_PROCESS,
    Tags = {
      Action = 'Balance',
      Account = sender,
    },
  })
end

function SendErrorMessage(account, message)
  Send({
    Target = CHAT_TARGET,
    Tags = {
      Action = 'ChatMessage',
      ['Author-Name'] = 'Oracle Llama',
      Recipient = account,
    },
    Data = message,
  })

  -- Refresh the game form for the user
  Send({
    Target = LLAMA_TOKEN_PROCESS,
    Tags = {
      Action = 'Balance',
      Account = account,
    },
  })
end

function SendWaitingMessage(account)
  Send({
    Target = account,
    Tags = { Type = 'SchemaExternal' },
    Data = json.encode({
      AskOracleLlama = {
        Title = "Bet Placed",
        Description = "Your bet has been placed. Waiting for confirmation...",
        Schema = nil,
      },
    })
  })
end

Handlers.add(
  'SchemaExternal',
  Handlers.utils.hasMatchingTag('Action', 'SchemaExternal'),
  function(msg)
    print('SchemaExternal from ' .. msg.From)
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
  'AdminAction',
  Handlers.utils.hasMatchingTag('Action', 'AdminAction'),
  function(msg)
    print('Withdraw to Admin ' .. msg.From .. ' ' .. FormatLlamaTokenAmount(msg.Tags.Quantity))
    Send({
      Target = LLAMA_TOKEN_PROCESS,
      Tags = {
        Action = 'Transfer',
        Recipient = msg.From,
        Quantity = tostring(msg.Tags.Quantity),
      },
    })
  end
)
