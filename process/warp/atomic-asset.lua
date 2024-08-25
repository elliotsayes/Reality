local bint = require('.bint')(256)
local json = require('json')

-- if Name ~= '[[1]]' then Name = '[[1]]' end
if Collection ~= 'DockWorldTEST' then Collection = 'DockWorldTEST' end
if Creator ~= '0cQJ5Hd4oCaL57CWP-Pqe5_e0D4_ZDWuxKBgR9ke1SI' then Creator = '0cQJ5Hd4oCaL57CWP-Pqe5_e0D4_ZDWuxKBgR9ke1SI' end
if Ticker ~= 'ATOMIC' then Ticker = 'ATOMIC' end
if Denomination ~= '1' then Denomination = '1' end
if not Balances then Balances = { ['JMS7P_To_Rs7c5WCATyHonAdFw_HvY2oyPWD07fbzMQ'] = '1' } end

Transferable = true

local function checkValidAddress(address)
  if not address or type(address) ~= 'string' then
    return false
  end

  return string.match(address, "^[%w%-_]+$") ~= nil and #address == 43
end

local function checkValidAmount(data)
  return (math.type(tonumber(data)) == 'integer' or math.type(tonumber(data)) == 'float') and bint(data) > 0
end

local function decodeMessageData(data)
  local status, decodedData = pcall(json.decode, data)

  if not status or type(decodedData) ~= 'table' then
    return false, nil
  end

  return true, decodedData
end

-- Read process state
Handlers.add('Info', Handlers.utils.hasMatchingTag('Action', 'Info'), function(msg)
  ao.send({
    Target = msg.From,
    Action = 'Read-Success',
    Data = json.encode({
      Name = Name,
      Ticker = Ticker,
      Denomination = Denomination,
      Balances = Balances,
      Transferable = Transferable
    })
  })
end)

-- Transfer balance to recipient (Data - { Recipient, Quantity })
Handlers.add('Transfer', Handlers.utils.hasMatchingTag('Action', 'Transfer'), function(msg)
  if not Transferable then
    ao.send({ Target = msg.From, Action = 'Validation-Error', Tags = { Status = 'Error', Message = 'Transfers are not allowed' } })
    return
  end

  local data = {
    Recipient = msg.Tags.Recipient,
    Quantity = msg.Tags.Quantity
  }

  if checkValidAddress(data.Recipient) and checkValidAmount(data.Quantity) then
    -- Transfer is valid, calculate balances
    if not Balances[data.Recipient] then
      Balances[data.Recipient] = '0'
    end

    Balances[msg.From] = tostring(bint(Balances[msg.From]) - bint(data.Quantity))
    Balances[data.Recipient] = tostring(bint(Balances[data.Recipient]) + bint(data.Quantity))

    -- If new balance zeroes out then remove it from the table
    if bint(Balances[msg.From]) <= 0 then
      Balances[msg.From] = nil
    end
    if bint(Balances[data.Recipient]) <= 0 then
      Balances[data.Recipient] = nil
    end

    local debitNoticeTags = {
      Status = 'Success',
      Message = 'Balance transferred, debit notice issued',
      Recipient = msg.Tags.Recipient,
      Quantity = msg.Tags.Quantity,
    }

    local creditNoticeTags = {
      Status = 'Success',
      Message = 'Balance transferred, credit notice issued',
      Sender = msg.From,
      Quantity = msg.Tags.Quantity,
    }

    for tagName, tagValue in pairs(msg) do
      if string.sub(tagName, 1, 2) == 'X-' then
        debitNoticeTags[tagName] = tagValue
        creditNoticeTags[tagName] = tagValue
      end
    end

    -- Send a debit notice to the sender
    ao.send({
      Target = msg.From,
      Action = 'Debit-Notice',
      Tags = debitNoticeTags,
      Data = json.encode({
        Recipient = data.Recipient,
        Quantity = tostring(data.Quantity)
      })
    })

    -- Send a credit notice to the recipient
    ao.send({
      Target = data.Recipient,
      Action = 'Credit-Notice',
      Tags = creditNoticeTags,
      Data = json.encode({
        Sender = msg.From,
        Quantity = tostring(data.Quantity)
      })
    })
  end
end)

-- Mint new tokens (Data - { Quantity })
Handlers.add('Mint', Handlers.utils.hasMatchingTag('Action', 'Mint'), function(msg)
  local decodeCheck, data = decodeMessageData(msg.Data)

  if decodeCheck and data then
    -- Check if quantity is present
    if not data.Quantity then
      ao.send({ Target = msg.From, Action = 'Input-Error', Tags = { Status = 'Error', Message = 'Invalid arguments, required { Quantity }' } })
      return
    end

    -- Check if quantity is a valid integer greater than zero
    if not checkValidAmount(data.Quantity) then
      ao.send({ Target = msg.From, Action = 'Validation-Error', Tags = { Status = 'Error', Message = 'Quantity must be an integer greater than zero' } })
      return
    end

    -- Check if owner is sender
    if msg.From ~= Owner then
      ao.send({ Target = msg.From, Action = 'Validation-Error', Tags = { Status = 'Error', Message = 'Only the process owner can mint new tokens' } })
      return
    end

    -- Mint request is valid, add tokens to the pool
    if not Balances[Owner] then
      Balances[Owner] = '0'
    end

    Balances[Owner] = tostring(bint(Balances[Owner]) + bint(data.Quantity))

    ao.send({ Target = msg.From, Action = 'Mint-Success', Tags = { Status = 'Success', Message = 'Tokens minted' } })
  else
    ao.send({
      Target = msg.From,
      Action = 'Input-Error',
      Tags = {
        Status = 'Error',
        Message = string.format('Failed to parse data, received: %s. %s', msg.Data,
          'Data must be an object - { Quantity }')
      }
    })
  end
end)

-- Read balance (Data - { Target })
Handlers.add('Balance', Handlers.utils.hasMatchingTag('Action', 'Balance'), function(msg)
  local decodeCheck, data = decodeMessageData(msg.Data)

  if decodeCheck and data then
    -- Check if target is present
    if not data.Target then
      ao.send({ Target = msg.From, Action = 'Input-Error', Tags = { Status = 'Error', Message = 'Invalid arguments, required { Target }' } })
      return
    end

    -- Check if target is a valid address
    if not checkValidAddress(data.Target) then
      ao.send({ Target = msg.From, Action = 'Validation-Error', Tags = { Status = 'Error', Message = 'Target is not a valid address' } })
      return
    end

    -- Check if target has a balance
    if not Balances[data.Target] then
      ao.send({ Target = msg.From, Action = 'Read-Error', Tags = { Status = 'Error', Message = 'Target does not have a balance' } })
      return
    end

    ao.send({
      Target = msg.From,
      Action = 'Read-Success',
      Tags = { Status = 'Success', Message = 'Balance received' },
      Data =
          Balances[data.Target]
    })
  else
    ao.send({
      Target = msg.From,
      Action = 'Input-Error',
      Tags = {
        Status = 'Error',
        Message = string.format('Failed to parse data, received: %s. %s', msg.Data,
          'Data must be an object - { Target }')
      }
    })
  end
end)

-- Read balances
Handlers.add('Balances', Handlers.utils.hasMatchingTag('Action', 'Balances'),
  function(msg) ao.send({ Target = msg.From, Action = 'Read-Success', Data = json.encode(Balances) }) end)

-- Initialize a request to add the uploaded asset to a profile
Handlers.add('Add-Asset-To-Profile', Handlers.utils.hasMatchingTag('Action', 'Add-Asset-To-Profile'), function(msg)
  if msg.From ~= Owner and msg.From ~= Creator and msg.From ~= ao.id then
    ao.send({
      Target = msg.From,
      Action = 'Authorization-Error',
      Tags = {
        Status = 'Error',
        Message = 'Unauthorized to access this handler'
      }
    })
    return
  end

  if checkValidAddress(Creator) then
    ao.assign({ Processes = { Creator }, Message = ao.id, Exclude = { 'Data', 'Anchor' } })
  else
    ao.send({
      Target = msg.From,
      Action = 'Input-Error',
      Tags = {
        Status = 'Error',
        Message = 'Creator tag not specified on asset spawn or not a valid Profile Process ID'
      }
    })
  end
end)
