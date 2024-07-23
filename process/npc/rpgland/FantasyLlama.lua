-- Name: FantasyLlama
-- PID: 2sOKN_T04Eik4zm2B_fyfEvAJCJVJjoXZNIWUegSQtw

-- PALM_ISLAND_PID = "OqvzTvpHYrfswvVZdsSldVTNBnyBOk7kZf-oqDdvUjg"
RPG_LAND_PID = "ZeDtHnbKThvHxN5NIudNRqtIlTle7KyGLQeiQTP1f_E"

CHAT_TARGET = RPG_LAND_PID

TIMESTAMP_LAST_MESSAGE_MS = TIMESTAMP_LAST_MESSAGE_MS or 0
COOLDOWN_MS = 5000

Handlers.add(
  'DefaultInteraction',
  Handlers.utils.hasMatchingTag('Action', 'DefaultInteraction'),
  function(msg)
    print('DefaultInteraction')
    if ((msg.Timestamp - TIMESTAMP_LAST_MESSAGE_MS) < COOLDOWN_MS) then
      return
    end

    Send({
      Target = CHAT_TARGET,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'Fantasy Llama',
      },
      Data =
      "Where on earth did you come from? I heard if you take the blue p...otion, you'll be able to return to your world.",
    })

    TIMESTAMP_LAST_MESSAGE_MS = msg.Timestamp
  end
)
