local json = require("json")

HasRegistered = HasRegistered or nil
LlamaLand = "9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss"

if (not HasRegistered) then
  print("Registering")
  Send({
    Target = LlamaLand,
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
      Target = LlamaLand,
      Tags = {
        Action = "VerseEntityUpdatePosition",
      },
      Data = json.encode({
        Position = {
          math.random(-5, 0),
          math.random(-5, 0),
        },
      }),
    })
    if (math.random(100) == 1) then
      Send({
        Target = LlamaLand,
        Tags = {
          Action = "ChatMessage",
        },
        Data = "Actually I like it better over here...",
      })
    end
  end
)
