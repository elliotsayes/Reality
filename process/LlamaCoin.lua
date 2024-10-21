-- TEST ProcessId: Btm_9_fvwb7eXbQ2VswA4V19HxYWnFsYRB4gIl3Dahw
-- PROD ProcessId: pazXumQI-HPH7iFGfTC-4_7biSnqz_U67oFAGry5zUY

-- Load this source file prior to loading the token blueprint:
-- aos> .load-blueprint token

local ao = require('ao')
local bint = require('.bint')(256)

local utils = {
  add = function(a, b)
    return tostring(bint(a) + bint(b))
  end,
  subtract = function(a, b)
    return tostring(bint(a) - bint(b))
  end,
  toBalanceValue = function(a)
    return tostring(bint(a))
  end,
  toNumber = function(a)
    return tonumber(a)
  end
}

local initialSupply = 0;

Denomination = 12
Name = 'Llama Coin'
Ticker = 'LLAMA'
Logo = '9FSEgmUsrug7kTdZJABDekwTGJy7YG7KaN5khcbwcX4'

-- Don't overwrite TotalSupply or Balances
MaxTotalSupply = utils.toBalanceValue(11111111 * 10 ^ Denomination)
TotalSupply = TotalSupply or utils.toBalanceValue(initialSupply * 10 ^ Denomination)
Balances = Balances or { [ao.id] = utils.toBalanceValue(initialSupply * 10 ^ Denomination) }

-- LlamaBankerDummy
LlamaBanker = 'ptvbacSmqJPfgCXxPc9bcobs5Th2B_SxTf81vRNkRzk'
Waitlist = '2dFSGGlc5xJb0sWinAnEFHM-62tQEbhDzi1v5ldWX5k'
-- Tracking = '7sniCE5rEM92PYgvIr0H9xK_yJf56FxSYN-eazRE__Y'

GrantWhitelist = {
  [LlamaBanker] = true,
  [Waitlist] = true,
  -- [Tracking] = true,
}

-- "grant" handler - like "mint", but adds tokens to a certain address
--[[
    Grant
   ]]
--
Handlers.add('grant', Handlers.utils.hasMatchingTag('Action', 'Grant'), function(msg)
  assert(type(msg.Recipient) == 'string', 'Recipient is required!')
  assert(type(msg.Quantity) == 'string', 'Quantity is required!')
  assert(bint(0) < bint(msg.Quantity), 'Quantity must be greater than zero!')

  if not Balances[msg.Recipient] then Balances[msg.Recipient] = "0" end

  if GrantWhitelist[msg.From] then
    local newTotalSupply = utils.add(TotalSupply, msg.Quantity)
    if bint(newTotalSupply) > bint(MaxTotalSupply) then
      print("Grant would exceed MaxTotalSupply to: " .. newTotalSupply)
      ao.send({
        Target = msg.From,
        Action = 'Grant-Error',
        ['Message-Id'] = msg.Id,
        Data = Colors.gray ..
            "Unable to Grant " .. Colors.blue .. msg.Quantity .. Colors.reset ..
            " to " .. msg.Recipient .. ", limited by MaxTotalSupply."
      })
      return;
    end

    -- Add tokens to the token pool, according to Quantity
    Balances[msg.Recipient] = utils.add(Balances[msg.Recipient], msg.Quantity)
    TotalSupply = newTotalSupply
    ao.send({
      Target = msg.From,
      Data = Colors.gray ..
          "Successfully granted " .. Colors.blue .. msg.Quantity .. Colors.reset .. " to " .. msg.Recipient
    })

    local grantNotice = {
      Target = msg.Recipient,
      Action = 'Grant-Notice',
      Sender = msg.From,
      Quantity = msg.Quantity,
      Data = Colors.gray ..
          "You were granted " ..
          Colors.blue .. msg.Quantity .. Colors.gray .. " from " .. Colors.green .. msg.From .. Colors.reset
    }

    -- Add forwarded tags to the credit and debit notice messages
    for tagName, tagValue in pairs(msg) do
      -- Tags beginning with "X-" are forwarded
      if string.sub(tagName, 1, 2) == "X-" then
        grantNotice[tagName] = tagValue
      end
    end

    -- Send Grant-Notice
    ao.send(grantNotice)
  else
    ao.send({
      Target = msg.From,
      Action = 'Grant-Error',
      ['Message-Id'] = msg.Id,
      Error = 'Only Grant Whitelist can grant new ' .. Ticker .. ' tokens!'
    })
  end
end)

-- Implementing Inflation for later

-- local inflationAmount = 100;
-- INFLATION_QUANTITY = utils.toBalanceValue(inflationAmount * 10 ^ Denomination);

-- -- Should be run every hour?
-- Handlers.add(
--   'CronHandler',
--   Handlers.utils.hasMatchingTag('Action', 'Cron-Tick'),
--   function(msg)
--     if (msg.From ~= ao.id) then
--       return print('Cron-Tick not from own process')
--     end

--     local mintQuantity = INFLATION_QUANTITY;
--     -- Mint $LLAMA
--     Send({
--       Target = ao.id,
--       Tags = {
--         Action = 'Mint',
--         Quantity = mintQuantity,
--       }
--     })
--     -- Allocate the newly minted $LLAMA to the banker
--     Send({
--       Target = ao.id,
--       Tags = {
--         Action = 'Transfer',
--         Quantity = mintQuantity,
--         Recipient = LlamaBanker,
--       }
--     })
--   end
-- )
