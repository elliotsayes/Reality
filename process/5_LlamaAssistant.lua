-- ProcessId: 7WFvRqDNYY4KpjaDSIxmQUVqNZviG4R25pX6buk9924

local ao = require('ao')
local json = require('json')

Handlers.add(
  'Petition',
  Handlers.utils.hasMatchingTag('Action', 'Petition'),
  function(msg)
    local offering = msg.Tags['Offering']
    local prompt = msg.Tags['Prompt']

    -- TODO: Implement the petition logic
  end
)

PetitionSchemaTags = [[
{
  "type": "object",
  "required": [
    "Action",
    "Offering",
    "Prompt"
  ],
  "properties": {
    "Action": {
      "type": "string",
      "const": "Petition"
    },
    "Offering": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "Prompt": {
      "type": "string",
      "minLength": 2,
      "maxLength": 100
    }
  }
}
]]

Api = {
  Petition = {
    Title = "Petition the LlamaFed",
    Description = "You must stake some $CRED for a chance to earn $LLAMA",
    Schema = {
      Tags = PetitionSchemaTags,
      -- Data
      -- Result?
    },
  },
}

Handlers.add(
  'Api',
  Handlers.utils.hasMatchingTag('Read', 'Api'),
  function(msg)
    ao.send({ Target = msg.From, Tags = { Type = 'Api' }, Data = json.encode(Api) })
  end
)
