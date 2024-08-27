-- Name: LlamaDockman
-- PID: CJcM_n0-s3gtt_Xqcffu5-AseTFARioG7iK4B3myeU4

local json = require('json')

LLAMA_DECKHANDS_PROCESS = '4s8UBQC0ojTyP0m1ym5K-AHOgsIe5f84gQi_RvyJsns'

function ONE_TO_TWENTY_TWO()
  local result = {}
  for i = 1, 22 do
    table.insert(result, tostring(i))
  end
  return json.encode(result)
end

function SetDockNumberTags()
  return [[
{
"type": "object",
"required": [
  "Action",
  "DockNumber"
],
"properties": {
  "Action": {
    "type": "string",
    "const": "SetDockNumber"
  },
  "DockNumber": {
    "type": "string",
    "enum": ]] .. ONE_TO_TWENTY_TWO() .. [[,
    "title": "Dock number",
    "description": "The dock to trade or configure"
  }
}
}
]]
end

Handlers.add(
  'SchemaExternal',
  Handlers.utils.hasMatchingTag('Action', 'SchemaExternal'),
  function(msg)
    print('SchemaExternal')
    Send({
      Target = msg.From,
      Tags = { Type = 'SchemaExternal' },
      Data = json.encode({
        Docks = {
          Target = LLAMA_DECKHANDS_PROCESS,
          Title = 'I heard these dock spots are tradable!',
          Description =
          'Check them out here: https://ao-bazar.arweave.net/#/collection/MwmJ69knT0MpsihR369PsxPsTOceDEsL5dOj5IjoP48/assets/',
          Schema = {
            Tags = json.decode(SetDockNumberTags()),
          },
        },
      })
    })
  end
)
