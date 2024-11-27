-- Process Name: TrackingTest
-- ProcessId: 7sniCE5rEM92PYgvIr0H9xK_yJf56FxSYN-eazRE__Y

local json = require("json")
local sqlite3 = require('lsqlite3')
local bint = require('.bint')(256)

-- 23 hours
REWARD_FREQUENCY_MS = 23 * 60 * 60 * 1000

TrackingDb = TrackingDb or sqlite3.open_memory()
TrackingDbAdmin = TrackingDbAdmin or require('DbAdmin').new(TrackingDb)

LLAMA_TOKEN_PROCESS = LLAMA_TOKEN_PROCESS or
    "TODO: LlamaTokenProcessId" -- Set to PROD
LLAMA_TOKEN_DENOMINATION = LLAMA_TOKEN_DENOMINATION or 12
LLAMA_TOKEN_MULTIPLIER = 10 ^ LLAMA_TOKEN_DENOMINATION

LLAMA_TOKEN_WHOLE_FIRST_LOGIN_REWARD = 5 * LLAMA_TOKEN_MULTIPLIER
LLAMA_TOKEN_WHOLE_DAILY_LOGIN_REWARD_BASE = 1 * LLAMA_TOKEN_MULTIPLIER
LLAMA_TOKEN_DAILY_LOGIN_MAX_MULTIPLIER = 10

--#region Initialization

SQLITE_TABLE_TRACKING = [[
  CREATE TABLE IF NOT EXISTS Login (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    WalletId TEXT UNIQUE,
    TimestampLastLogin INTEGER
  );
]]

function TrackingDbInit()
  TrackingDb:exec(SQLITE_TABLE_TRACKING)
end

TrackingInitialized = TrackingInitialized or false
if (not TrackingInitialized) then
  TrackingDbInit()
  TrackingInitialized = true
end

--#endregion

CanClaimLoginReward = CanClaimLoginReward or function(walletId)
  return true
end

--#region Writes

Handlers.add(
  "Tracking-Login",
  Handlers.utils.hasMatchingTag("Action", "Tracking-Login"),
  function(msg)
    print("Tracking-Login")

    local walletId = msg.From

    if CanClaimLoginReward(walletId) ~= true then
      Send({
        Target = msg.From,
        Tags = {
          Action = "Login-Info",
          Message = "Become a Llama Land Citizen to be eligible for login rewards!",
        },
      })
      return
    end

    -- Find last login, if any
    local lastLogin = nil
    local logins = TrackingDbAdmin:exec(string.format([[
      SELECT * FROM Login
      WHERE WalletId = '%s'
      ORDER BY TimestampLastLogin DESC
      LIMIT 1
    ]], walletId))
    if #logins > 0 then
      lastLogin = logins[1].TimestampLastLogin
    end

    if not lastLogin then
      print("First login: " .. walletId)
      TrackingDbAdmin:exec(string.format([[
        INSERT INTO Login (WalletId, TimestampLastLogin)
        VALUES ('%s', %d)
      ]], walletId, msg.Timestamp))
      -- Give first login reward
      local quantity = CalcAndClaimFirstLoginReward(walletId)
      Send({
        Target = msg.From,
        Tags = {
          Action = "Login-Reward",
          Message = "You claimed your waitlist reward, congratulations!",
          Quantity = quantity,
        },
      })
      Send({
        Target = LLAMA_TOKEN_PROCESS,
        Tags = {
          Action = "Grant",
          Recipient = msg.From,
          Quantity = quantity,
        },
      })
      return -- Don't need anything else
    end

    local timeSinceLastLogin = msg.Timestamp - lastLogin
    if (timeSinceLastLogin > REWARD_FREQUENCY_MS) then
      print("Reward for login: " .. walletId)

      -- Update record
      TrackingDbAdmin:exec(string.format([[
        UPDATE Login
        SET TimestampLastLogin = %d
        WHERE WalletId = '%s'
      ]], msg.Timestamp, walletId))

      local multiplier = math.random(1, LLAMA_TOKEN_DAILY_LOGIN_MAX_MULTIPLIER)
      local quantity = tostring(bint(LLAMA_TOKEN_WHOLE_DAILY_LOGIN_REWARD_BASE * multiplier))
      Send({
        Target = msg.From,
        Tags = {
          Action = "Login-Reward",
          Message = "Enjoy this reward for logging in again today!",
          Quantity = quantity,
        },
      })
      Send({
        Target = LLAMA_TOKEN_PROCESS,
        Tags = {
          Action = "Grant",
          Recipient = msg.From,
          Quantity = quantity,
        },
      })
    else
      print("No reward for login: " .. walletId)
      Send({
        Target = msg.From,
        Tags = {
          Action = "Login-Info",
          Message = "No Reward",
        },
      })
    end
  end
)

return print("Loaded Tracking")
