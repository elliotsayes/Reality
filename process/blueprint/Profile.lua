local json = require("json")

Profiles = Profiles or {
  -- ["ProfileId"] = {
  --   Created = 1713833416559,
  --   LastSeen = 1713833416559,
  --   Name = "Some Guy",
  --   Following = {},
  --   --Meta = {
  --   --  WeaveWorld = {
  --   AvatarSeed = "a1204030b070a01", -- pixel art seed
  --   Status = "Just a guy",
  --   CurrentWorldId = "a1C-TCUNUKCaEup0BiCXNwcVWxOVOiRBfmKuBZwPWZg",
  --   --  }
  --   --}
  -- }
}

Handlers.add(
  "Profiles",
  Handlers.utils.hasMatchingTag("Action", "Profiles"),
  function(msg)
    print("Profiles")

    local data = json.decode(msg.Data)
    local profileIds = data.ProfileIds;
    -- TODO: Validate profileIds

    local profiles = {}
    for _, profileId in ipairs(profileIds) do
      profiles[profileId] = Profiles[profileId]
    end

    Send({
      Target = msg.From,
      Tags = {
        MsgRef = msg.Id,
        Result = "OK",
      },
      Data = json.encode(profiles),
    })
  end
)

function ReplyError(msg, error)
  print("[" .. msg.From .. " => " .. msg.Id .. "] Error: " .. error)
  Send({
    Target = msg.From,
    Tags = {
      MsgRef = msg.Id,
      Result = "Error",
    },
    Error = error,
  })
end

Handlers.add(
  "ProfileCreate",
  Handlers.utils.hasMatchingTag("Action", "ProfileCreate"),
  function(msg)
    print("ProfileCreate")
    local profileId = msg.From

    local data = json.decode(msg.Data)
    local existingProfile = Profiles[profileId]
    if (existingProfile) then
      -- TODO: Strict
      -- ReplyError(msg, "Profile already exists")
      -- return
    end

    -- TODO: Validate data

    -- Build a new profile
    local newProfile = {
      Created = msg.Timestamp,
      LastSeen = msg.Timestamp,
      Name = data.Name,
      Following = {},
      -- Meta = data.Meta,
      AvatarSeed = data.AvatarSeed,
      Status = data.Status,
      CurrentWorldId = data.CurrentWorldId,
    }

    Profiles[profileId] = newProfile
    Send({
      Target = msg.From,
      Tags = {
        MsgRef = msg.Id,
        Result = "OK",
      },
      Data = json.encode(newProfile),
    })
  end
)


Handlers.add(
  "ProfileUpdate",
  Handlers.utils.hasMatchingTag("Action", "ProfileUpdate"),
  function(msg)
    print("ProfileUpdate")
    local profileId = msg.From

    local data = json.decode(msg.Data)
    local existingProfile = Profiles[profileId]
    if (not existingProfile) then
      ReplyError(msg, "Profile not found")
    end

    -- TODO: Validate data

    -- Update the last seen
    existingProfile.LastSeen = msg.Timestamp

    -- Merge in Following
    -- if (data.Following) then
    --   for _, profileId in ipairs(data.Following) do
    --     existingProfile.Following[profileId] = true
    --   end
    -- end

    -- -- Merge in the WeaveWorld meta
    -- if (data.Meta.WeaveWorld) then
    --   for key, value in pairs(data.Meta.WeaveWorld) do
    --     existingProfile.Meta.WeaveWorld[key] = value
    --   end
    -- end

    -- Merge in the other data
    for key, value in pairs(data) do
      if (key ~= "LastSeen" and key ~= "Following" and key ~= "Meta") then
        existingProfile[key] = value
      end
    end

    Send({
      Target = msg.From,
      Tags = {
        MsgRef = msg.Id,
        Result = "OK",
      },
      Data = json.encode(existingProfile),
    })
  end
)
