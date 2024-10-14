-- Name: llamaland-waitlist-1
-- ProcessId: 2dFSGGlc5xJb0sWinAnEFHM-62tQEbhDzi1v5ldWX5k

local json = require("json")
local sqlite3 = require('lsqlite3')

LLAMA_BANKER_PROCESS = LLAMA_BANKER_PROCESS or "ptvbacSmqJPfgCXxPc9bcobs5Th2B_SxTf81vRNkRzk"
LLAMA_KING_PROCESS = LLAMA_KING_PROCESS or "kPjfXLFyjJogxGRRRe2ErdYNiexolpHpK6wGkz-UPVA"
LLAMA_CITIZENSHIP_PROCESS = LLAMA_CITIZENSHIP_PROCESS or "o20viT_yWRooVjt7x84mobxADRM5y2XG9WMFr7U3_KQ"

-- 12 Hours
BUMP_DELAY_MS = 12 * 60 * 60 * 1000

WaitlistDb = WaitlistDb or sqlite3.open_memory()
WaitlistDbAdmin = WaitlistDbAdmin or require('DbAdmin').new(WaitlistDb)

--#region Initialization

SQLITE_TABLE_WAITLIST = [[
  CREATE TABLE IF NOT EXISTS Waitlist (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    WalletId TEXT UNIQUE,
    TimestampCreated INTEGER,
    TimestampLastBumped INTEGER,
    BumpCount INTEGER
    -- Flagged INTEGER DEFAULT 0,
    -- Authorised INTEGER DEFAULT 0,
    -- Claimed INTEGER DEFAULT 0
  );
]]

function WaitlistDbInit()
  WaitlistDb:exec(SQLITE_TABLE_WAITLIST)
end

WaitlistInitialized = WaitlistInitialized or false
if (not WaitlistInitialized) then
  WaitlistDbInit()
  WaitlistInitialized = true
end

--#endregion

--#region Reads

function ValidateOffset(testOffset)
  if (type(testOffset) ~= "number") then
    return false
  end
  if (testOffset < 0) then
    return false
  end

  return true
end

function ValidateLimit(testLimit)
  if (type(testLimit) ~= "number") then
    return false
  end
  if (testLimit < 0) then
    return false
  end
  if (testLimit > 100) then
    return false
  end

  return true
end

function QueryRankWaitlist(offset, limit, bumpCountOrder, timestampLastBumpedOrder, ranks)
  local query = [[
    SELECT
      *
    FROM
      Waitlist
    ORDER BY
      BumpCount ]] .. bumpCountOrder .. [[,
      TimestampLastBumped ]] .. timestampLastBumpedOrder .. [[

    LIMIT ? OFFSET ?;]]
  local stmt = WaitlistDb:prepare(query)
  stmt:bind_values(
    limit or 20,
    offset or 0
  )

  local rankEntries = {}
  local index = 1
  print(ranks)
  for row in stmt:nrows() do
    table.insert(rankEntries, {
      Rank = ranks[index],
      Id = row.Id,
      WalletId = row.WalletId,
      TimestampCreated = row.TimestampCreated,
      TimestampLastBumped = row.TimestampLastBumped,
      BumpCount = row.BumpCount,
    })
    index = index + 1
  end
  stmt:finalize()

  return rankEntries
end

function Range(from, to, step)
  step = step or 1
  local range = {}
  for i = from, to, step do
    table.insert(range, i)
  end
  return range
end

Handlers.add(
  "WaitlistState",
  Handlers.utils.hasMatchingTag("Read", "Waitlist-State"),
  function(msg)
    print("WaitlistState")
    -- Doesn't need to be validated
    local userAddress = msg.From

    local limitTop = tonumber(msg.Tags['Limit-Top']) or 10
    if (not ValidateLimit(limitTop)) then
      return print("Invalid Limit-Top")
    end
    local limitBottom = tonumber(msg.Tags['Limit-Bottom']) or 10
    if (not ValidateLimit(limitBottom)) then
      return print("Invalid Limit-Bottom")
    end
    local limitSurroundingPlusMinus = tonumber(msg.Tags['Limit-Surrounding']) or 10
    if (not ValidateLimit(limitSurroundingPlusMinus)) then
      return print("Invalid Limit-Surrounding")
    end

    local waitlistCount = WaitlistDbAdmin:count('Waitlist')

    local waitlistUserPosition = 0;
    local waitlistUser = nil;
    -- Get the rank of the user
    -- Sort by BumpCount DESC, TimestampLastBumped ASC
    -- Should be safe to string.format msg.From
    local waitlistQuery = WaitlistDbAdmin:exec(string.format([[
    SELECT
      *
    FROM
      (
        SELECT
          *,
          ROW_NUMBER() OVER (ORDER BY BumpCount DESC, TimestampLastBumped ASC) AS Rank
        FROM
          Waitlist
      )
    WHERE
      WalletId = '%s'
    ]], userAddress))

    if (waitlistQuery and #waitlistQuery == 1) then
      local row = waitlistQuery[1]
      waitlistUserPosition = row.Rank
      waitlistUser = {
        Rank = row.Rank,
        WalletId = row.WalletId,
        TimestampCreated = row.TimestampCreated,
        TimestampLastBumped = row.TimestampLastBumped,
        BumpCount = row.BumpCount,
        Authorised = row.Authorised,
        Claimed = row.Claimed,
      }
    end

    -- Query waitlist limits
    local rankAscEntries = QueryRankWaitlist(0, limitTop, "DESC", "ASC", Range(1, limitTop))
    local rankDescEntries = QueryRankWaitlist(0, limitBottom, "ASC", "DESC",
      Range(waitlistCount, waitlistCount - limitBottom, -1))

    local surroundingLower = math.max(waitlistUserPosition - limitSurroundingPlusMinus, 0)
    local surroundingUpper = math.min(waitlistUserPosition + limitSurroundingPlusMinus, waitlistCount)
    local rankAscSurroundingEntries = QueryRankWaitlist(
      surroundingLower,
      limitSurroundingPlusMinus * 2 + 1,
      "DESC",
      "ASC",
      Range(surroundingLower + 1, surroundingUpper + 1)
    )

    -- Reply with messages
    Send({
      Target = msg.From,
      Tags = {
        Action = "Waitlist-State-Response",
      },
      Data = json.encode({
        Count = waitlistCount,
        UserPosition = waitlistUserPosition,
        User = waitlistUser,
        RankDesc = rankDescEntries,
        RankAsc = rankAscEntries,
        RankAscSurrounding = rankAscSurroundingEntries,
      })
    })
  end
)

Handlers.add(
  "WaitlistPage",
  Handlers.utils.hasMatchingTag("Read", "Waitlist-Page"),
  function(msg)
    print("WaitlistPage")

    local offset = tonumber(msg.Tags['Offset']) or 0
    if (not ValidateOffset(offset)) then
      return print("Invalid Offset")
    end

    local limit = tonumber(msg.Tags['Limit']) or 10
    if (not ValidateLimit(limit)) then
      return print("Invalid Limit")
    end

    -- Query waitlist
    local rankDescEntries = QueryRankWaitlist(offset, limit, "DESC", "ASC", Range(offset + 1, offset + 1 + limit))

    -- Reply with messages
    Send({
      Target = msg.From,
      Tags = {
        Action = "Waitlist-Page-Response",
      },
      Data = json.encode({
        Offset = offset,
        Limit = limit,
        Page = rankDescEntries,
      })
    })
  end
)

--#endregion

--#region Old

-- Handlers.add(
--   "WaitlistRegister",
--   Handlers.utils.hasMatchingTag("Action", "Waitlist-Register"),
--   function(msg)
--     print("WaitlistRegister")

--     local userAddress = msg.From
--     local nowMs = msg.Timestamp

--     local waitlistCount = WaitlistDbAdmin:count('Waitlist')
--     if (waitlistCount >= 22000) then
--       return print("Waitlist is full")
--     end

--     local stmt = WaitlistDb:prepare([[
--       INSERT INTO Waitlist (WalletId, TimestampCreated, TimestampLastBumped, BumpCount)
--       VALUES (?, ?, ?, ?)
--     ]])
--     stmt:bind_values(
--       userAddress,
--       nowMs,
--       nowMs,
--       0
--     )
--     stmt:step()
--     local result = stmt:finalize()

--     if (result == 19) then
--       return print("User already in waitlist")
--     end

--     if (result ~= 0) then
--       return print("Failed to add user to waitlist")
--     end

--     -- Return the entry back to the user
--     Send({
--       Target = msg.From,
--       Tags = {
--         Action = "Waitlist-Register-Response",
--       },
--       Data = json.encode({
--         WalletId = userAddress,
--         TimestampCreated = nowMs,
--         TimestampLastBumped = nowMs,
--         BumpCount = 0
--       })
--     })
--   end
-- )
Handlers.remove("WaitlistRegister")

-- Handlers.add(
--   "WaitlistBump",
--   Handlers.utils.hasMatchingTag("Action", "Waitlist-Bump"),
--   function(msg)
--     print("WaitlistBump")

--     local userAddress = msg.From
--     local nowMs = msg.Timestamp

--     -- Get the current entry
--     local currentRows = WaitlistDbAdmin:exec(string.format([[
--       SELECT * FROM Waitlist WHERE WalletId = '%s'
--     ]], userAddress))
--     -- Get length of currentRow table
--     if (not currentRows or #currentRows == 0) then
--       return print("User not found in waitlist")
--     end

--     local currentRow = currentRows[1]
--     local lastBumpedMs = currentRow.TimestampLastBumped

--     -- Check if the user is allowed to bump
--     if (nowMs - lastBumpedMs < BUMP_DELAY_MS) then
--       return print("User cannot bump yet")
--     end

--     -- Update the entry
--     local newBumpCount = currentRow.BumpCount + 1
--     WaitlistDbAdmin:exec(string.format([[
--       UPDATE Waitlist
--       SET TimestampLastBumped = %d,
--           BumpCount = %d
--       WHERE WalletId = '%s'
--     ]], nowMs, newBumpCount, userAddress))

--     -- Build updated entry
--     local newEntry = {
--       WalletId = userAddress,
--       TimestampCreated = currentRow.TimestampCreated,
--       TimestampLastBumped = nowMs,
--       BumpCount = newBumpCount
--     }

--     -- Return the entry back to the user
--     Send({
--       Target = msg.From,
--       Tags = {
--         Action = "Waitlist-Bump-Response",
--       },
--       Data = json.encode(newEntry)
--     })
--   end
-- )
Handlers.remove("WaitlistBump")

--#endregion

Handlers.add("Grant-Citizenship",
  Handlers.utils.hasMatchingTag("Action", "Grant-Citizenship"),
  function(msg)
    if (msg.From ~= LLAMA_CITIZENSHIP_PROCESS) then
      return print("Grant-Citizenship: Not from " .. LLAMA_CITIZENSHIP_PROCESS)
    end

    local walletId = msg.Tags["WalletId"]
    AuthoriseWallet(walletId, msg.Timestamp)
  end
)


function AuthoriseWallet(walletId, timestamp)
  print("Authorising: " .. walletId)

  local currentRows = WaitlistDbAdmin:exec(string.format([[
    SELECT * FROM Waitlist WHERE WalletId = '%s'
  ]], walletId))

  if (not currentRows or #currentRows == 0) then
    WaitlistDbAdmin:exec(string.format([[
      INSERT INTO Waitlist (WalletId, TimestampCreated, TimestampLastBumped, BumpCount, Flagged, Authorised, Claimed)
      VALUES ('%s', %d, %d, %d, %d, %d, %d)
    ]], walletId, timestamp, timestamp, 0, 0, 1, 0))
  else
    WaitlistDbAdmin:exec(string.format([[
      UPDATE Waitlist
      SET Authorised = %d, Flagged = %d
      WHERE WalletId = '%s'
    ]], 1, 0, walletId))
  end

  -- Propagate authorisation to Llama Banker
  Send({
    Target = LLAMA_BANKER_PROCESS,
    Tags = {
      Action = "Authorise",
      WalletId = walletId,
    },
  })

  -- Propagate authorisation to Llama King
  Send({
    Target = LLAMA_KING_PROCESS,
    Tags = {
      Action = "Authorise",
      WalletId = walletId,
    },
  })

  -- Propagate authorisation to Llama Citizenship
  Send({
    Target = LLAMA_CITIZENSHIP_PROCESS,
    Tags = {
      Action = "Authorise",
      WalletId = walletId,
    },
  })
end

function FlagWallet(walletId)
  print("Flagging: " .. walletId)
  WaitlistDbAdmin:exec(string.format([[
    UPDATE Waitlist
    SET Flagged = %d
    WHERE WalletId = '%s'
  ]], 1, walletId))
end

function ClaimWallet(walletId)
  WaitlistDbAdmin:exec(string.format([[
    UPDATE Waitlist
    SET Claimed = %d
    WHERE WalletId = '%s'
  ]], 1, walletId))
end

CanClaimLoginReward = function(walletId)
  local currentRows = WaitlistDbAdmin:exec(string.format([[
    SELECT * FROM Waitlist WHERE WalletId = '%s'
  ]], walletId))
  -- Get length of currentRow table
  if (not currentRows or #currentRows == 0) then
    return false
  end

  local currentRow = currentRows[1]
  return currentRow.Flagged == 0 and currentRow.Authorised ~= 0
end

LLAMA_TOKEN_DENOMINATION = LLAMA_TOKEN_DENOMINATION or 12
LLAMA_TOKEN_MULTIPLIER = 10 ^ LLAMA_TOKEN_DENOMINATION

local bint = require('.bint')(256)

CalcAndClaimFirstLoginReward = function(walletId, timestamp)
  -- Flag as claimed
  ClaimWallet(walletId)

  return tostring(bint(25 * LLAMA_TOKEN_MULTIPLIER))
end

return "Loaded Waitlist Protocol"
