-- Name: LlamaDetectiveGuide
-- ProcessID: sotxMLNR92QNc3zR5UI_llr8Hgen_wpuPhlcp9HCr4E

local json = require('json')

Handlers.add(
  'Schema',
  Handlers.utils.hasMatchingTag('Action', 'Schema'),
  function(msg)
    print('Schema')
    return Send({
      Target = msg.From,
      Tags = { Type = 'Schema' },
      Data = json.encode({
        Guide = {
          Title = 'Elias\'s Detective Game',
          Description =
          'Look around this world for llamas with puzzles from Elias. Check the leaderboard at the top left - if you are the first to solve a puzzle, you can reserve your reward with the prize llama. There is a grand prize for whoever claims the Atomic Asset sitting in a secret wallet! Hint: look for buildings with open doors.',
          Schema = nil,
        },
      })
    })
  end
)
