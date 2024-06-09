local json = require("json")

HasRegistered = HasRegistered or nil
OriginIsland = "a1C-TCUNUKCaEup0BiCXNwcVWxOVOiRBfmKuBZwPWZg"

if (not HasRegistered) then
  print("Registering")
  Send({
    Target = OriginIsland,
    Tags = {
      Action = "VerseEntityCreate",
    },
    Data = json.encode({
      Type = "Avatar",
    }),
  })
  HasRegistered = true;
end

Handlers.add(
  "CronTick",                                      -- handler name
  Handlers.utils.hasMatchingTag("Action", "Cron"), -- handler pattern to identify cron message
  function()                                       -- handler task to execute on cron message
    print("CronTick")
    Send({
      Target = OriginIsland,
      Tags = {
        Action = "VerseEntityUpdatePosition",
      },
      Data = json.encode({
        Position = {
          math.random(-5, 5),
          math.random(-5, 5),
        },
      }),
    })
    Send({
      Target = OriginIsland,
      Tags = {
        Action = "ChatMessage",
      },
      Data = "Actually I like it better over here...",
    })
  end
)
