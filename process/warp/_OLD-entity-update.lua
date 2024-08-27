local json = require("json")

PROFILE_REGISTRY = "SNy4m-DrqxWl01YqGM4sxI8qCni-58re8uuJLvZPypY"

function HasBalance(id)
  return Balances[id] and tonumber(Balances[id]) > 0
end

Handlers.add(
  "Warp.UpdateTarget",
  Handlers.utils.hasMatchingTag("Action", "Warp.UpdateTarget"),
  function(msg)
    local address = msg.From

    print("Warp.UpdateTarget", address)

    local authed = false;

    if HasBalance(address) then authed = true end

    if not authed then
      print("Sending Get-Profiles-By-Delegate")
      local registryReq = Send({
        Target = PROFILE_REGISTRY,
        Tags = {
          Action = "Get-Profiles-By-Delegate",
        },
        Data = json.encode({
          Address = address,
        })
      })
      local registryRes = registryReq.receive()
      print("Received Get-Profiles-By-Delegate")
      -- if true then return end
      local registryWallets = json.decode(registryRes.Data)
      -- local registryWallets = {
      --   {
      --     CallerAddress = "0cQJ5Hd4oCaL57CWP-Pqe5_e0D4_ZDWuxKBgR9ke1SI",
      --     ProfileId = "JMS7P_To_Rs7c5WCATyHonAdFw_HvY2oyPWD07fbzMQ",
      --     Role = "Admin"
      --   }
      -- }

      for _, profile in pairs(registryWallets) do
        if profile.CallerAddress == address
            and HasBalance(profile.ProfileId) then
          authed = true

          print("Profile found with balance")
          print(profile)
          break
        end
      end
    end

    if not authed then
      print("No address or profile found with balance")
      Send({
        Target = address,
        Tags = {
          Action = "Validation-Error",
        },
        Data = json.encode({
          Status = "Error",
          Message = "No address or profile found with balance",
        })
      })
      return
    end

    local data = json.decode(msg.Data)
    local Target = data.Target
    -- local Position = data.Position

    print("Updating Target", Target)

    -- -- Get world name
    -- local worldInfoReq = Send({
    --   Target = Target,
    --   Tags = {
    --     Action = "Reality.Info",
    --   },
    -- })
    -- local worldInfoRes = worldInfoReq.receive()
    -- local worldInfo = json.decode(worldInfoRes.Data)
    -- local displayName = worldInfo.Name

    local displayName = DISPLAY_NAME

    Send({
      Target = DOCK_WORLD,
      Tags = {
        Action = "Reality.EntityCreate",
      },
      Data = json.encode({
        Type = "Hidden",
        Metadata = {
          DisplayName = displayName,
          Interaction = {
            Type = "Warp",
            Size = { 1, 2 },
            Target = Target,
            -- Position = Position,
          },
        }
      })
    })
  end
)
