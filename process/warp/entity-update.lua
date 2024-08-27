local json = require("json")

PROFILE_REGISTRY = "SNy4m-DrqxWl01YqGM4sxI8qCni-58re8uuJLvZPypY"

function HasBalance(id)
  return Balances[id] and tonumber(Balances[id]) > 0
end

PENDING_REQUESTS = {
  -- {
  --   Target = "<processId>",
  --   DisplayName = "<displayName>",
  -- }
}

function UpdateWarp(target, displayName)
  print("Updating Target", target)

  Send({
    Target = DOCK_WORLD,
    Tags = {
      Action = "Reality.EntityCreate",
    },
    Data = json.encode({
      Type = "Hidden",
      Metadata = {
        DisplayName = '#' .. DOCK_NUMBER .. ' ' .. (displayName or ''),
        Interaction = {
          Type = "Warp",
          Size = { 1, 2 },
          Target = target,
          -- Position = Position,
        },
      }
    })
  })
end

Handlers.add(
  "Warp.UpdateTarget",
  Handlers.utils.hasMatchingTag("Action", "Warp.UpdateTarget"),
  function(msg)
    local address = msg.From

    print("Warp.UpdateTarget", address)

    local target = msg.Tags.WorldTarget
    local displayName = msg.Tags.WorldName

    if HasBalance(address) then
      UpdateWarp(target, displayName)
    else
      PENDING_REQUESTS[address] = {
        Target = target,
        DisplayName = displayName,
      }

      print("Sending Get-Profiles-By-Delegate")
      Send({
        Target = PROFILE_REGISTRY,
        Tags = {
          Action = "Get-Profiles-By-Delegate",
        },
        Data = json.encode({
          Address = address,
        })
      })
    end
  end
)

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
      if HasBalance(profile.ProfileId) then
        local pending = PENDING_REQUESTS[profile.CallerAddress]
        if pending ~= nil then
          UpdateWarp(pending.Target, pending.DisplayName)
          PENDING_REQUESTS[profile.CallerAddress] = nil
          return
        else
          print("No pending request for", profile.CallerAddress)
        end
      end
    end
  end
)
