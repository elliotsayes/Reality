-- ProcessId: Btm_9_fvwb7eXbQ2VswA4V19HxYWnFsYRB4gIl3Dahw

-- Load this script prior to the token blueprint
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
Balances = Balances or { [LlamaBanker] = utils.toBalanceValue(10000 * 10 ^ Denomination) }
