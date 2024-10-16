-- Name: LlamaImmigration
-- ProcessId: o20viT_yWRooVjt7x84mobxADRM5y2XG9WMFr7U3_KQ

local sqlite3 = require('lsqlite3')

WAITLIST_PROCESS = WAITLIST_PROCESS or "2dFSGGlc5xJb0sWinAnEFHM-62tQEbhDzi1v5ldWX5k"
-- Same as LlamaFed
LLAMA_FED_CHAT_PROCESS = "QIFgbqEmk5MyJy01wuINfcRP_erGNNbhqHRkAQjxKgg"

ImmigrationDb = ImmigrationDb or sqlite3.open_memory()
ImmigrationDbAdmin = ImmigrationDbAdmin or require('DbAdmin').new(ImmigrationDb)

SQLITE_TABLE_AUTHORISED = [[
  CREATE TABLE IF NOT EXISTS Authorised (
    WalletId TEXT PRIMARY KEY,
    Timestamp INTEGER
  );
]]

function InitDb()
  ImmigrationDb:exec(SQLITE_TABLE_AUTHORISED)
end

ImmigrationInitialized = ImmigrationInitialized or false
if (not ImmigrationInitialized) then
  InitDb()
  ImmigrationInitialized = true
end

function AuthoriseWallet(walletId, timestamp)
  print("Authorising: " .. walletId)
  if timestamp == nil then
    timestamp = 0
  end
  local stmt = ImmigrationDb:prepare("INSERT INTO Authorised (WalletId, Timestamp) VALUES (?, ?)")
  stmt:bind_values(walletId, timestamp)
  stmt:step()
  stmt:finalize()
end

function UnauthoriseWallet(walletId)
  print("Unauthorising: " .. walletId)
  local stmt = ImmigrationDb:prepare("DELETE FROM Authorised WHERE WalletId = ?")
  stmt:bind_values(walletId)
  stmt:step()
  stmt:finalize()
end

function IsAuthorised(walletId)
  local authorised = ImmigrationDbAdmin:exec(
    "SELECT * FROM Authorised WHERE WalletId = '" .. walletId .. "'"
  )
  return #authorised > 0
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

    if (IsAuthorised(walletId)) then
      return print("Already Authorised: " .. walletId)
    end

    AuthoriseWallet(walletId, msg.Timestamp)

    Send({
      Target = LLAMA_FED_CHAT_PROCESS,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'Citizenship Llama',
        -- Recipient = walletId,
      },
      Data = "Hear Ye, citizens of Llama Land! Please welcome our newest subject: " .. walletId,
    })
  end
)

VOUCH_PROCESS = "ZTTO02BL2P-lseTLUgiIPD9d0CF1sc4LbMA2AQ7e9jo"
VOUCHER_WHITELIST = {
  -- Vouch-X
  ["Ax_uXyLQBPZSQ15movzv9-O1mDo30khslqN64qD27Z8"] = true,
  -- Vouch-Gitcoin-Passport
  ["k6p1MtqYhQQOuTSfN8gH7sQ78zlHavt8dCDL88btn9s"] = true,
  -- Vouch-AO-Balance
  ["QeXDjjxcui7W2xU08zOlnFwBlbiID4sACpi0tSS3VgY"] = true,
  -- Vouch-wAR-Stake
  ["3y0YE11i21hpP8UY0Z1AVhtPoJD4V_AbEBx-g0j9wRc"] = true,
}

local json = require("json")

function GetVouchScoreUsd(walletId)
  ao.send({
    Target = VOUCH_PROCESS,
    Tags = {
      Action = "Get-Vouches",
      ID = walletId,
    }
  })

  local resp = Handlers.receive({
    From = VOUCH_PROCESS,
    Action = "VouchDAO.Vouches",
    ID = walletId,
  })

  local success, data = pcall(json.decode, resp.Data)
  if not success or type(data) ~= 'table' then
    print("Invalid data: " .. resp.Data)
    return 0
  end

  local vouches = data['Vouchers']
  if vouches == nil then
    print("No Vouchers")
    return 0
  end

  local score = 0
  for voucher, vouch in pairs(vouches) do
    if VOUCHER_WHITELIST[voucher] then
      local vouchFor = vouch['Vouch-For']
      if vouchFor ~= walletId then
        print(voucher .. " has Vouch-For mismatch, expected: " .. walletId .. ", got: " .. vouchFor)
      else
        -- 1.34-USD -> 1.34
        local valueStr = string.match(vouch.Value, "([%d%.]+)-USD")
        local value = tonumber(valueStr)
        if valueStr == nil or value == nil then
          print(voucher .. " has invalid value: " .. vouch.Value)
        else
          score = score + value
        end
      end
    end
  end

  return score
end

Handlers.add(
  "Immigrate",
  Handlers.utils.hasMatchingTag("Action", "Immigrate"),
  function(msg)
    print("Immigrate")
    if (IsAuthorised(msg.From)) then
      return print("Already Immigrated: " .. msg.From)
    end
    local score = GetVouchScoreUsd(msg.From)
    print(msg.From .. "'s score: " .. score)

    if not (score >= 2) then
      return print("Score too low: " .. score)
    end

    Send({
      Target = WAITLIST_PROCESS,
      Tags = {
        Action = "Grant-Citizenship",
        WalletId = msg.From,
      }
    })

    Send({
      Target = LLAMA_FED_CHAT_PROCESS,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'Citizenship Llama',
        Recipient = msg.From,
      },
      Data =
      "Your application for citizenship has been recieved and will be processed post-haste! You may collect your complimentary 25 $LLAMA coin upon next login 🦙🤝🪙",
    })
  end
)

Handlers.add(
  'Schema',
  Handlers.utils.hasMatchingTag('Action', 'Schema'),
  function(msg)
    print('Schema')
    if (IsAuthorised(msg.From)) then
      Send({
        Target = msg.From,
        Tags = { Type = 'Schema' },
        Data = json.encode({
          Immigrate = {
            Title = "Greetings Citizen!",
            Description =
            "Always happy to see another subject of the glorious Llama King. If you have any distinguished llama friends who wish to join or ranks, send them my way!",
            Schema = nil,
          },
        })
      })
    else
      local score = GetVouchScoreUsd(msg.From)
      print("Score: " .. score)
      if score < 2 then
        Send({
          Target = msg.From,
          Tags = { Type = 'Schema' },
          Data = json.encode({
            Immigrate = {
              Title = "Hello, Peasant...",
              Description =
              "Your reputation leaves something to be desired... please visit https://vouch-portal.arweave.net/ to improve your score. Once you gain at least 2 Vouch Points, you may be granted Llama Land Citizenship and a complimentary 25 $LLAMA coin!",
              Schema = nil,
            },
          })
        })
      else
        Send({
          Target = msg.From,
          Tags = { Type = 'Schema' },
          Data = json.encode({
            Immigrate = {
              Title = "Salutations Sir!",
              Description =
              "Your reputation precedes you! Welcome to the Llama Kingdom. We would be delighted to offer you citizenship and a complimentary 25 $LLAMA coin. Simply click 'Submit' to proceed.",
              Schema = {
                Tags = json.decode([[
{
  "type": "object",
  "required": ["Action"],
  "properties": {
    "Action": {
      "type": "string",
      "const": "Immigrate"
    }
  }
}]])
              },
            },
          })
        })
      end
    end
  end
)
