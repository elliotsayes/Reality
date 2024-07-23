-- Name: LlamaSailor
-- PID: abyG0zg0RnguuedHwrjpxPkzc2qcXeX7Pfc2dyfypXw

-- PALM_ISLAND_PID = "OqvzTvpHYrfswvVZdsSldVTNBnyBOk7kZf-oqDdvUjg"
-- RPG_LAND_PID = "ZeDtHnbKThvHxN5NIudNRqtIlTle7KyGLQeiQTP1f_E"
LLAMA_LAND_PID = "9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss"

CHAT_TARGET = LLAMA_LAND_PID

TIMESTAMP_LAST_MESSAGE_MS = TIMESTAMP_LAST_MESSAGE_MS or 0
COOLDOWN_MS = 5000

QUOTES = {
  "A smooth sea never made a skilled llama sailor.",
  "Set sail on the llama seas and let the adventure begin.",
  "Llamas who dare to take the helm discover new worlds.",
  "In the heart of every llama is a navigator of the unknown.",
  "Llamas at sea always find their way home.",
  "Sail away with the courage of a llama.",
  "A true llama sailor knows the stars guide their way.",
  "Ride the waves like a brave llama on the ocean's crest.",
  "Llamas and sailors both know the value of the journey.",
  "A llama's heart is as vast as the ocean it sails.",
  "The call of the sea awakens the llama within.",
  "Llamas chart their own course across life's vast ocean.",
  "The best voyages are made with a llama by your side.",
  "Llamas at sea know no bounds.",
  "With the wind in their fur, llamas sail with grace.",
  "Llamas are the true captains of the soul's voyage.",
  "The llama's sail unfurled leads to new horizons.",
  "Courage is the llama's compass on the high seas.",
  "The llama's spirit is unyielding, even in the fiercest storms.",
  "Sailing llamas embrace the unknown with open hearts.",
  "A llama sailor's journey is written in the waves.",
  "Llamas find serenity in the endless blue of the sea.",
  "Every llama sailor knows that the journey is the destination.",
  "Llamas set sail not to escape life, but for life not to escape them.",
  "The llama's voyage is a dance with the ocean's rhythm.",
  "Llamas are born adventurers, destined to roam the seas.",
  "Llamas at sea hear the whispers of ancient mariners.",
  "A llama's journey is measured in sunsets and stars.",
  "Sailing llamas discover treasures beyond gold and silver.",
  "The ocean is the llama's playground, and the ship its steed.",
  "Llamas navigate the seas with hearts full of dreams.",
  "In every llama sailor is the spirit of an explorer.",
  "Llamas know that the sea's embrace is both gentle and fierce.",
  "The call of the llama is a call to adventure.",
  "Llamas ride the tide with fearless grace.",
  "A llama sailor's soul is as deep as the ocean's abyss.",
  "The waves carry the llama's dreams to distant shores.",
  "Every llama sailor is a poet of the sea.",
  "Llamas find freedom in the boundless ocean.",
  "The horizon is a llama's invitation to explore.",
  "Llamas at sea feel the pulse of the world's heartbeat.",
  "The sea's whispers are the llama's lullaby.",
  "A llama's journey is marked by the stars they follow.",
  "Llamas embrace the mystery of the deep blue sea.",
  "The ocean's vastness mirrors the llama's adventurous spirit.",
  "Llamas and the sea share an eternal bond.",
  "In the heart of a llama sailor lies the essence of the sea.",
  "Llamas chase the wind with sails full of dreams.",
  "The sea is a llama's canvas, painted with every voyage.",
  "Llamas know that true north is found in the heart.",
}

Handlers.add(
  'DefaultInteraction',
  Handlers.utils.hasMatchingTag('Action', 'DefaultInteraction'),
  function(msg)
    print('DefaultInteraction')
    if ((msg.Timestamp - TIMESTAMP_LAST_MESSAGE_MS) < COOLDOWN_MS) then
      return
    end

    local randomEnough = msg.Timestamp
    local quote = QUOTES[randomEnough % #QUOTES + 1]

    Send({
      Target = CHAT_TARGET,
      Tags = {
        Action = 'ChatMessage',
        ['Author-Name'] = 'Llama Sailor',
      },
      Data = quote,
    })

    TIMESTAMP_LAST_MESSAGE_MS = msg.Timestamp
  end
)
