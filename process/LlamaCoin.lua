-- ProcessId: Btm_9_fvwb7eXbQ2VswA4V19HxYWnFsYRB4gIl3Dahw

-- Load this script prior to the token blueprint:
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

Denomination = 12
TotalSupply = utils.toBalanceValue(10000 * 10 ^ Denomination)
Name = 'Llama Coin'
Ticker = 'LLAMA'
-- Logo = '' -- TODO: 'SBCCXwwecBlDqRLUjb8dYABExTJXLieawf7m2aBJ-KY'

-- LlamaBankerDummy
LlamaBanker = 'ptvbacSmqJPfgCXxPc9bcobs5Th2B_SxTf81vRNkRzk'

-- Don't overwrite Balances
Balances = Balances or { [LlamaBanker] = utils.toBalanceValue(100 * 10 ^ Denomination) }

INFLATION_AMOUNT = 100;

-- Should be run every hour?
Handlers.add(
  'CronHandler',
  Handlers.utils.hasMatchingTag('Action', 'Cron-Tick'),
  function(msg)
    if (msg.From ~= ao.id) then
      return print('Cron-Tick not from own process')
    end

    local mintQuantity = tostring(INFLATION_AMOUNT)
    -- Mint $LLAMA
    Send({
      Tags = {
        Action = 'Mint',
        Quantity = mintQuantity,
      }
    })
    -- Allocate the newly minted $LLAMA to the banker
    Send({
      Tags = {
        Action = 'Transfer',
        Recipient = mintQuantity,
      }
    })
  end
)
