-- Name: FantasyLlama

CHAT_TARGET = CHAT_TARGET or 'TODO: Put your verse ID here'

-- To add this agent to your verse, configure your Static Entities table, e.g.:
-- VerseEntitiesStatic = {
--   ['<your agent process Id>'] = {
--     Position = { 10, 10 },
--     Type = 'Avatar',
--     Metadata = {
--       DisplayName = 'Fantasy Llama',
--       SkinNumber = 5,
--       Interaction = {
--         Type = 'Default',
--       },
--     },
--   },
-- }

TIMESTAMP_LAST_MESSAGE_MS = TIMESTAMP_LAST_MESSAGE_MS or 0

-- Limit sending a message to every so often
COOLDOWN_MS = 10000 -- 10 seconds

Handlers.add(
  'DefaultInteraction',
  Handlers.utils.hasMatchingTag('Action', 'DefaultInteraction'),
  function(msg)
    print('DefaultInteraction')
    if ((msg.Timestamp - TIMESTAMP_LAST_MESSAGE_MS) < COOLDOWN_MS) then
      return print("Message on cooldown")
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
