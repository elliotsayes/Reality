-- Name: LlamaDeckhands
-- PID: 4s8UBQC0ojTyP0m1ym5K-AHOgsIe5f84gQi_RvyJsns

local json = require('json')

LLAMA_DOCK_CHAT = "vtxDQx59thIrSrfN7Zn8AWDz0Vy496q360eVCCtN4Gs"
PROFILE_REGISTRY = "SNy4m-DrqxWl01YqGM4sxI8qCni-58re8uuJLvZPypY"

USER_DOCK_NUMBERS = USER_DOCK_NUMBERS or {
  -- [address] = dockNumber
}

DOCK_SPOT_PROCESS_IDS = {
  "GLzqdndamqi2vc--gHRN3LzHyMP6SvRJZo2vmFjaEsY",
  "CYy93DFzjGdNqieFVmM_DA6vNwq9tsEbhHEP_RqDLiM",
  "BWFBaMrZ6Gku-80hzrkuWDInamp2ilfsBbrg-oolR8U",
  "GuiojYagV2Lrqgu-v9uUtKNCNldc8M-7RlSQC357TXo",
  "SBqchbhXocljDy1XMxv5itGr0cjzKRR-H7S3Thum90Y",
  "u7wACTVz5zyaki4ORrYu1_2QT9RJL88BYf2z3NIdpWs",
  "fK0I_qTPOmycpkNimdJs_1bdlLRSJSYVAxYZp8YczJ8",
  "Qg2bzZVVtbCTxuY-iX5rIzx2GMooFUqCvPvYuc6Mt2M",
  "N4I3V9TLYxFxfyhrFgWYLI-YZV9u9cWVi9qqxMixML8",
  "nd8P6zSwACA2fVCpX61LASYExjSW20s2LNdhclkokf0",
  "4Q13ml4iZHgHszZw8rkt5tAgatMpTHCwt37eZym7B8Q",
  "b32qUz4TxAFLQXj1E7jokB68Cu3xAt2EkCPmouMC7A4",
  "-rIvSu630eh-m7KpG-_kRIm9jW8OvD_VPt-caCgemuo",
  "YuZXg0Tgw9qcT8agaqCIdjZ_FFXFT1nSc6LfLFS-RXo",
  "qGoJncGJFa3qEPRx8qtey_gqLzzPyx63f4afqrYVBis",
  "kR1eOrN153oVAjRnhcshimzX3dcbsvGEaBdRv7-xvtM",
  "C4C5Hz-W-Rgag33pB83bj1ZBP818M4sbG9gA_RG6fuU",
  "onS1mfjtLqctr60Dw1bhotNfkmQMnPkTZbZOXbL4Vmg",
  "OnmRO00BU8VmzjU-bgEMfQozvrFB-hLMe8q8y5gAwnA",
  "dHGZ-4dJDhJn4AfAxzS1pHiVRrOWLgDezRX3pWvI4DM",
  "ElP87FCeHuoVC_1s4A3wlz7wNsG2_H-WUD0jgE_4kYI",
  "X6sEQ6QRWPsQEhM9o4Bwbw6YE4WIX-fypt49Z9a4keM",
}

DOCK_OWNER_PROFILES = DOCK_OWNER_PROFILES or {
  -- [DOCK_SPOT_PROCESS_ID] = profile
}

DOCK_PROFILE_WALLETS = DOCK_OWNER_PROFILES or {
  -- [profile] = wallet
}

function GetWalletProfiles(walletId)
  Send({
    Target = PROFILE_REGISTRY,
    Tags = {
      Action = "Get-Profiles-By-Delegate",
    },
    Data = json.encode({
      Address = walletId,
    })
  })
end

Handlers.add(
  "Profile-Success",
  Handlers.utils.hasMatchingTag("Action", "Profile-Success"),
  function(msg)
    print("Profile-Success")

    if msg.From ~= PROFILE_REGISTRY then
      return print("Unauthorized Profile-Success")
    end

    local data = json.decode(msg.Data)
    for _, profile in ipairs(data) do
      DOCK_PROFILE_WALLETS[profile.ProfileId] = profile.CallerAddress
    end
  end
)

function UpdateAsset(number)
  local processId = DOCK_SPOT_PROCESS_IDS[number]

  Send({
    Target = processId,
    Tags = { Action = "Info" }
  })
end

Handlers.add(
  "AssetInfo",
  function(msg)
    if msg.Tags.Action ~= "Read-Success" then
      return false
    end
    for _, processId in ipairs(DOCK_SPOT_PROCESS_IDS) do
      if processId == msg.From then
        return true
      end
    end
    return false
  end,
  function(msg)
    print("AssetInfo")

    local data = json.decode(msg.Data)
    local balances = data.Balances

    for profileId, balance in pairs(balances) do
      if tonumber(balance) > 0 then
        DOCK_OWNER_PROFILES[msg.From] = profileId
        return
      end
    end
  end
)

Handlers.add(
  "SetDockNumber",
  Handlers.utils.hasMatchingTag("Action", "SetDockNumber"),
  function(msg)
    local newNumber = math.floor(tonumber(msg.Tags.DockNumber) or 0)
    if (newNumber < 1 or newNumber > 22) then
      return print("Invalid dock number: " .. newNumber)
    end

    local oldNumber = USER_DOCK_NUMBERS[msg.From]

    if newNumber == oldNumber then
      return print("Dock number already set to: " .. newNumber)
    end

    USER_DOCK_NUMBERS[msg.From] = newNumber
    GetWalletProfiles(msg.From)
    UpdateAsset(newNumber)

    Send({
      Target = LLAMA_DOCK_CHAT,
      Tags = {
        Action = "ChatMessage",
        Recipient = msg.From,
        ['Author-Name'] = 'Llama Deckhands',
      },
      Data = "You're interested in Dock #" .. newNumber .. '? Come and talk to me!'
    })
  end
)

function SENoSelection(msg)
  Send({
    Target = msg.From,
    Tags = { Type = 'SchemaExternal' },
    Data = json.encode({
      DockConfig = {
        Target = '',
        Title = 'You want to to trade or configure a dock?',
        Description = 'Go and talk to the Dockman first!',
        Schema = nil,
      },
    })
  })
end

function SENotOwner(msg)
  local dockNumber = USER_DOCK_NUMBERS[msg.From]
  local dockProcessId = DOCK_SPOT_PROCESS_IDS[dockNumber] or "NONE"

  Send({
    Target = msg.From,
    Tags = { Type = 'SchemaExternal' },
    Data = json.encode({
      DockConfig = {
        Target = '',
        Title = 'Are you interested in purchasing Dock #' .. dockNumber .. '?',
        Description =
            'You can check it out on Bazar! See the Atomic Asset here: https://ao-bazar.arweave.net/#/asset/' ..
            dockProcessId,
        Schema = nil,
      },
    })
  })
end

function ConfigSchemaTags()
  return [[
{
"type": "object",
"required": [
  "Action",
  "WorldTarget",
  "WorldName"
],
"properties": {
  "Action": {
    "type": "string",
    "const": "Warp.UpdateTarget"
  },
  "WorldTarget": {
    "type": "string",
    "minLength": 43,
    "maxLength": 43,
    "title": "World Process",
    "description": "The process ID of your world that implements Reality protocol"
  },
  "WorldName": {
    "type": "string",
    "title": "World Name",
    "maxLength": 32,
    "description": "The label for your boat"
  }
}
}
]]
end

function SEOwner(msg)
  local dockNumber = USER_DOCK_NUMBERS[msg.From]
  local dockProcessId = DOCK_SPOT_PROCESS_IDS[dockNumber]

  Send({
    Target = msg.From,
    Tags = { Type = 'SchemaExternal' },
    Data = json.encode({
      DockConfig = {
        Target = dockProcessId,
        Title = 'Dock #' .. dockNumber .. ' is yours!',
        Description = 'Hello owner! Where would you like your boat at dock #' .. dockNumber .. ' to go today?',
        Schema = {
          Tags = json.decode(ConfigSchemaTags())
        },
      },
    })
  })
end

Handlers.add(
  'SchemaExternal',
  Handlers.utils.hasMatchingTag('Action', 'SchemaExternal'),
  function(msg)
    print('SchemaExternal')
    local dockNumber = USER_DOCK_NUMBERS[msg.From]

    if dockNumber == nil then
      return SENoSelection(msg)
    end

    local dockProcessId = DOCK_SPOT_PROCESS_IDS[dockNumber]
    local dockOwnerProfile = DOCK_OWNER_PROFILES[dockProcessId]
    local dockWallet = DOCK_PROFILE_WALLETS[dockOwnerProfile]

    -- print("Dock Owner Profile: " .. dockOwnerProfile)
    -- print("Dock Wallet: " .. dockWallet)
    -- print("From: " .. msg.From)

    if dockWallet == msg.From then
      return SEOwner(msg)
    end

    return SENotOwner(msg)
  end
)
