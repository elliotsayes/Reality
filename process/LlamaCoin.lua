-- ProcessId: Btm_9_fvwb7eXbQ2VswA4V19HxYWnFsYRB4gIl3Dahw

-- To ensure correct starting balances, load this script prior to the token blueprint.
-- To load the token blueprint:
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

local initialSupply = 100;

Denomination = 12
TotalSupply = utils.toBalanceValue(initialSupply * 10 ^ Denomination)
Name = 'Llama Coin'
Ticker = 'LLAMA'
-- Logo = '' -- TODO: 'SBCCXwwecBlDqRLUjb8dYABExTJXLieawf7m2aBJ-KY'

-- LlamaBankerDummy
LlamaBanker = 'ptvbacSmqJPfgCXxPc9bcobs5Th2B_SxTf81vRNkRzk'

-- Don't overwrite Balances
Balances = Balances or { [LlamaBanker] = utils.toBalanceValue(initialSupply * 10 ^ Denomination) }

local inflationAmount = 100;
INFLATION_QUANTITY = utils.toBalanceValue(inflationAmount * 10 ^ Denomination);

-- Should be run every hour?
Handlers.add(
  'CronHandler',
  Handlers.utils.hasMatchingTag('Action', 'Cron-Tick'),
  function(msg)
    if (msg.From ~= ao.id) then
      return print('Cron-Tick not from own process')
    end

    local mintQuantity = INFLATION_QUANTITY;
    -- Mint $LLAMA
    Send({
      Target = ao.id,
      Tags = {
        Action = 'Mint',
        Quantity = mintQuantity,
      }
    })
    -- Allocate the newly minted $LLAMA to the banker
    Send({
      Target = ao.id,
      Tags = {
        Action = 'Transfer',
        Quantity = mintQuantity,
        Recipient = LlamaBanker,
      }
    })
  end
)
