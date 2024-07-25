-- ProcessName: LlamaWarpmaster4
-- ProcessId: FdDJu16cgYE4KAT07jXtxvukntAE3JZaE3WrNnAjGis

-- 64 Bit
-- LlamaWarpmaster1: 10sfHicPvJcpiM3owbKjt8MOrJtea0nnIpZ1CTwI-RY
local json = require('json')
local sqlite3 = require('lsqlite3')

WARP_CANDIDATES = {
  {
    Name = 'PalmIsland',
    PID = 'OqvzTvpHYrfswvVZdsSldVTNBnyBOk7kZf-oqDdvUjg',
  },
  {
    Name = 'RpgLand',
    PID = 'ZeDtHnbKThvHxN5NIudNRqtIlTle7KyGLQeiQTP1f_E',
  },
}
WARP_CANDIDATE_NAMES = {}
for _, v in ipairs(WARP_CANDIDATES) do
  table.insert(WARP_CANDIDATE_NAMES, v.Name)
end
WARP_CANDIDATE_NAMES_JSON = json.encode(WARP_CANDIDATE_NAMES)

WARP_CURRENT = WARP_CURRENT or WARP_CANDIDATES[1]

CHAT_TARGET = '9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss'
WORLD_TARGET = '9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss'

LLAMA_TOKEN_PROCESS = 'pazXumQI-HPH7iFGfTC-4_7biSnqz_U67oFAGry5zUY'
LLAMA_TOKEN_DENOMINATION = 12
LLAMA_TOKEN_MULTIPLIER = 10 ^ LLAMA_TOKEN_DENOMINATION
LLAMA_VOTE_WHOLE_MIN = 10
LLAMA_VOTE_WHOLE_MAX = 100
LLAMA_VOTE_WHOLE_MIN_QUANTITY = LLAMA_VOTE_WHOLE_MIN * LLAMA_TOKEN_MULTIPLIER
LLAMA_VOTE_WHOLE_MAX_QUANTITY = LLAMA_VOTE_WHOLE_MAX * LLAMA_TOKEN_MULTIPLIER

REFUND_WINDOW_MS = (7 * 24 - 1) * 60 * 60 * 1000 -- 1 week less 1h
VOTE_WINDOW_MS = (7 * 24) * 60 * 60 * 1000       -- 1 week

WarpmasterDb = WarpmasterDb or sqlite3.open_memory()
WarpmasterDbAdmin = WarpmasterDbAdmin or require('DbAdmin').new(WarpmasterDb)

SQLITE_TABLE_LLAMA_CREDIT = [[
  CREATE TABLE IF NOT EXISTS LlamaCredit (
    MessageId TEXT PRIMARY KEY,
    Timestamp INTEGER,
    Sender TEXT,
    Quantity INTEGER,
    Vote TEXT,
    Refunded INTEGER DEFAULT 0
  );
]]

function InitDb()
  WarpmasterDb:exec(SQLITE_TABLE_LLAMA_CREDIT)
end

WarpmasterInitialized = WarpmasterInitialized or false
if (not WarpmasterInitialized) then
  InitDb()
  WarpmasterInitialized = true
end

function FindHighestVotedWarp(timestamp)
  local query = string.format([[
SELECT
  Vote,
  SUM(Quantity) AS `Total`
FROM
  LlamaCredit
WHERE
  Timestamp > %d
GROUP BY
  Vote
ORDER BY
  Total DESC,
  Timestamp ASC
LIMIT 1
]], timestamp - VOTE_WINDOW_MS)
  local highestVote = nil
  for row in WarpmasterDb:nrows(query) do
    highestVote = row.Vote
  end
  return highestVote
end

function DetectAndHandleHighestVotedWarp(timestamp)
  local savedWarp = WARP_CURRENT
  local highestVote = FindHighestVotedWarp(timestamp)
  if highestVote ~= nil then
    for _, v in ipairs(WARP_CANDIDATES) do
      if v.Name == highestVote then
        WARP_CURRENT = v
        break
      end
    end
  end

  if WARP_CURRENT.Name ~= savedWarp.Name then
    -- Write in Chat
    Send({
      Target = CHAT_TARGET,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'Boatmaster',
      },
      Data = "The warp target has been updated to " .. WARP_CURRENT.Name .. "!",
    })

    -- Handle setting the warp target

    -- Hide old entity
    Send({
      Target = WORLD_TARGET,
      Tags = {
        Action = 'Reality.EntityHide',
        EntityId = savedWarp.PID,
      },
    })

    -- Show new entity
    Send({
      Target = WORLD_TARGET,
      Tags = {
        Action = 'Reality.EntityFix',
        EntityId = WARP_CURRENT.PID,
      },
    })
  end
end

function RefundExpiredVotes(timestamp)
  local query = string.format([[
SELECT
  MessageId,
  Sender,
  Quantity
FROM
  LlamaCredit
WHERE
  Timestamp < %d AND Refunded = 0
]], timestamp - REFUND_WINDOW_MS)
  for row in WarpmasterDb:nrows(query) do
    -- Refund the sender
    Send({
      Target = LLAMA_TOKEN_PROCESS,
      Tags = {
        Action = 'Transfer',
        Recipient = row.Sender,
        Quantity = tostring(math.floor(row.Quantity)),
      },
    })

    -- Mark as refunded
    local stmt = WarpmasterDb:prepare [[
      UPDATE LlamaCredit
      SET Refunded = 1
      WHERE MessageId = ?
    ]]
    stmt:bind_values(row.MessageId)
    stmt:step()
    stmt:finalize()
  end
end

function ValidateLlamaQuantity(quantity)
  return quantity ~= nil
      and quantity >= LLAMA_VOTE_WHOLE_MIN_QUANTITY
      and quantity <= LLAMA_VOTE_WHOLE_MAX_QUANTITY
end

function ValidateWarpVote(vote)
  return vote ~= nil and (vote == 'PalmIsland' or vote == 'RpgLand')
end

function FormatLlamaTokenAmount(amount)
  return string.format("%.1f", amount / LLAMA_TOKEN_MULTIPLIER)
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
    local messageId = msg.Id

    local quantity = tonumber(msg.Tags.Quantity)
    if not ValidateLlamaQuantity(quantity) then
      return print("Invalid quantity")
    end

    local vote = msg.Tags['X-Vote']
    if not ValidateWarpVote(vote) then
      return print("Invalid vote")
    end

    -- Save metadata
    local stmt = WarpmasterDb:prepare [[
      INSERT INTO LlamaCredit
      (MessageId, Timestamp, Sender, Quantity, Vote)
      VALUES (?, ?, ?, ?, ?)
    ]]
    stmt:bind_values(messageId, msg.Timestamp, sender, quantity, vote)
    stmt:step()
    stmt:finalize()

    -- Write in Chat
    Send({
      Target = CHAT_TARGET,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'Boatmaster',
      },
      Data = "Hear ye, hear ye! An offering of " ..
          FormatLlamaTokenAmount(quantity) .. " $LLAMA to vote for " .. vote .. ".",
    })

    DetectAndHandleHighestVotedWarp(msg.Timestamp)
  end
)


-- Schema

function PetitionSchemaTags()
  return [[
{
"type": "object",
"required": [
  "Action",
  "Recipient",
  "Quantity",
  "X-Vote"
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
    "default": ]] .. LLAMA_VOTE_WHOLE_MIN .. [[,
    "minimum": ]] .. LLAMA_VOTE_WHOLE_MIN .. [[,
    "maximum": ]] .. LLAMA_VOTE_WHOLE_MAX .. [[,
    "title": "$LLAMA amount (refunded in a week) (]] ..
      LLAMA_VOTE_WHOLE_MIN .. [[-]] .. LLAMA_VOTE_WHOLE_MAX .. [[).",
    "$comment": "]] .. LLAMA_TOKEN_MULTIPLIER .. [["
  },
  "X-Vote": {
    "type": "string",
    "enum": ]] .. WARP_CANDIDATE_NAMES_JSON .. [[,
    "default": "]] .. WARP_CANDIDATES[1].Name .. [[",
    "title": "Your preferred world",
  }
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
    print('Account: ' .. account .. ', Balance: ' .. balance)

    -- Query the database for total LlamaCredit quantities for each in last week
    local query = string.format([[
SELECT
  Vote,
  SUM(Quantity) AS `Total`
FROM
  LlamaCredit
WHERE
  Timestamp > %d
GROUP BY
  Vote
]], msg.Timestamp - VOTE_WINDOW_MS)
    local voteQuantitesStr = ' Current target: ' .. WARP_CURRENT.Name .. '. Current votes: '
    for row in WarpmasterDb:nrows(query) do
      voteQuantitesStr = voteQuantitesStr .. row.Vote .. ': ' .. FormatLlamaTokenAmount(row.Total) .. ' $LLAMA, '
    end

    if (balance >= (LLAMA_VOTE_WHOLE_MIN_QUANTITY)) then
      Send({
        Target = account,
        Tags = { Type = 'SchemaExternal' },
        Data = json.encode({
          WarpVote = {
            Target = LLAMA_TOKEN_PROCESS,
            Title = "Vote for the desination",
            Description =
                "Stake some $LLAMA to vote for this week's desination—you'll get it back in a week." ..
                voteQuantitesStr,
            Schema = {
              Tags = json.decode(PetitionSchemaTags()),
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
          WarpVote = {
            Target = LLAMA_TOKEN_PROCESS, -- Can be nil? In that case it must be supplied externally
            Title = "Vote for the desination",
            Description = "You don't have enough $LLAMA to vote, try begging the King for some?" ..
                voteQuantitesStr,
            Schema = nil,
          },
        })
      })
    end
  end
)

Handlers.add(
  'SchemaExternal',
  Handlers.utils.hasMatchingTag('Action', 'SchemaExternal'),
  function(msg)
    print('SchemaExternal')
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
  'CronTick',
  Handlers.utils.hasMatchingTag('Action', 'Cron'),
  function(msg)
    print('CronTick')
    DetectAndHandleHighestVotedWarp(msg.Timestamp)
    RefundExpiredVotes(msg.Timestamp)
  end
)

Handlers.add(
  'WarpCurrent',
  Handlers.utils.hasMatchingTag('Action', 'WarpCurrent'),
  function(msg)
    print('WarpCurrent')
    DetectAndHandleHighestVotedWarp(msg.Timestamp)
    Send({
      Target = msg.From,
      Tags = {
        Action = 'WarpCurrent',
        WarpName = WARP_CURRENT.Name,
        WarpPID = WARP_CURRENT.PID,
      },
    })
  end
)
