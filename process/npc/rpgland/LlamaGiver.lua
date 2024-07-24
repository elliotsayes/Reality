-- ProcessName: LlamaGiver
-- ProcessId: D5r-wBDfgo_Cx52uYoI8YiHp7QTqvpPbL8TtcbCoaXk

local json = require('json')
local sqlite3 = require('lsqlite3')

LLAMA_TOKEN_PROCESS = 'pazXumQI-HPH7iFGfTC-4_7biSnqz_U67oFAGry5zUY'
LLAMA_TOKEN_DENOMINATION = 12
LLAMA_TOKEN_MULTIPLIER = 10 ^ LLAMA_TOKEN_DENOMINATION
LLAMA_DONATION_SIZE_WHOLE = 1
LLAMA_DONATION_SIZE_QUANTITY = math.floor(LLAMA_DONATION_SIZE_WHOLE * LLAMA_TOKEN_MULTIPLIER)

-- RPG Land
CHAT_TARGET = "ZeDtHnbKThvHxN5NIudNRqtIlTle7KyGLQeiQTP1f_E"

GiverDb = GiverDb or sqlite3.open_memory()
GiverDbAdmin = GiverDbAdmin or require('DbAdmin').new(GiverDb)

SQLITE_TABLE_DONATION = [[
  CREATE TABLE IF NOT EXISTS Donation (
    WalletId TEXT PRIMARY KEY,
    Timestamp INTEGER NOT NULL
  );
]]

function InitDb()
  GiverDbAdmin:exec(SQLITE_TABLE_DONATION)
end

GiverInitialized = GiverInitialized or false
if (not GiverInitialized) then
  InitDb()
  GiverInitialized = true
end

function FormatLlamaTokenAmount(amount)
  return string.format("%.1f", amount / LLAMA_TOKEN_MULTIPLIER)
end

function HasAlreadyDonated(walletId)
  local stmt = GiverDb:prepare [[
    SELECT COUNT(*) AS `N`
    FROM Donation
    WHERE WalletId = ?
  ]]
  stmt:bind_values(walletId)
  for row in stmt:nrows() do
    return row.N > 0
  end
  return false
end

OUT_OF_LLAMA = OUT_OF_LLAMA or false

Handlers.add(
  "OutOfLlama",
  Handlers.utils.hasMatchingTag("Error", "Insufficient Balance!"),
  function(msg)
    if (msg.From ~= LLAMA_TOKEN_PROCESS) then
      return
    end

    local sender = msg.From

    -- Write in chat
    Send({
      Target = CHAT_TARGET,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'Llama Giver',
      },
      Data = "Well this is embarassing... I seem to be out of $LLAMA. Come back again later.",
    })

    OUT_OF_LLAMA = true
  end
)

Handlers.add(
  "MoreLlama",
  Handlers.utils.hasMatchingTag("Action", "Credit-Notice"),
  function(msg)
    if (msg.From ~= LLAMA_TOKEN_PROCESS) then
      return
    end

    local sender = msg.From

    -- Write in chat
    Send({
      Target = CHAT_TARGET,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'Llama Giver',
      },
      Data = "I have more $LLAMA to give! My generosity knows no bounds!",
    })

    OUT_OF_LLAMA = false
  end
)

Handlers.add(
  "GetDonation",
  Handlers.utils.hasMatchingTag("Action", "GetDonation"),
  function(msg)
    local sender = msg.From

    -- Check if the sender has already donated
    local already = HasAlreadyDonated(sender)

    if (already) then
      -- Write in chat
      Send({
        Target = CHAT_TARGET,
        Tags = {
          Action = 'ChatMessage',
          ['Author-Name'] = 'Llama Giver',
          Recipient = sender,
        },
        Data = "Hey, I think I rememember you! Now now, don't be greedy...",
      })
      return
    end

    -- Record the donation
    GiverDbAdmin:exec(string.format([[
      INSERT INTO Donation (WalletId, Timestamp)
      VALUES ('%s', %d)
    ]], sender, msg.Timestamp))

    -- Write in Chat
    Send({
      Target = CHAT_TARGET,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'Llama Giver',
        Recipient = sender,
      },
      Data = "By my boundless grace, I shall bestow upon you the generous sum of " ..
          FormatLlamaTokenAmount(LLAMA_DONATION_SIZE_QUANTITY) .. " $LLAMA."
    })

    -- Grant Llama Coin
    Send({
      Target = LLAMA_TOKEN_PROCESS,
      Tags = {
        Action = 'Transfer',
        Recipient = sender,
        Quantity = tostring(LLAMA_DONATION_SIZE_QUANTITY),
      },
    })
  end
)

-- Schema

function GetDonationSchemaTags()
  return [[
{
"type": "object",
"required": [
  "Action",
],
"properties": {
  "Action": {
    "type": "string",
    "const": "GetDonation"
  },
}
}
]]
end

Handlers.add(
  'Schema',
  Handlers.utils.hasMatchingTag('Action', 'Schema'),
  function(msg)
    print('Schema')
    -- Query the database to see if the account has donated
    local walletId = msg.From

    if (OUT_OF_LLAMA) then
      Send({
        Target = walletId,
        Tags = { Type = 'Schema' },
        Data = json.encode({
          GetDonation = {
            Title = "Well, this is embarassing...",
            Description = "I was so generous today that I ran out of $LLAMA! Come back later.",
            Schema = nil,
          },
        })
      })
      return
    end

    local already = HasAlreadyDonated(walletId)

    if (already) then
      Send({
        Target = walletId,
        Tags = { Type = 'Schema' },
        Data = json.encode({
          GetDonation = {
            Title = "You have already received your donation!",
            Description = "I'm not made of $LLAMA you know...",
            Schema = nil,
          },
        })
      })
      return
    end

    Send({
      Target = walletId,
      Tags = { Type = 'Schema' },
      Data = json.encode({
        GetDonation = {
          Title = "Well done for finding me!",
          Description = "You have found the Llama Giver. Click below to recieve a small donation.",
          Schema = {
            Tags = json.decode(GetDonationSchemaTags()),
            -- Data
            -- Result?
          },
        },
      })
    })
  end
)
