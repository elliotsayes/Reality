-- ProcessId: y_obnQk5mkphKlulM7v1Xyn6IhJKZGhP_BC1qLJq46w

local ao = require('ao')
local json = require('json')

local credTokenProcessId = 'Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc'
local llamaFedProcessId = 'IN3T2l6QERA6d65XGW5asx2JWX7VrOQ3HIbwQvKVBQo'

Handlers.add(
  'Petition',
  Handlers.utils.hasMatchingTag('Action', 'Petition'),
  function(msg)
    local offering = msg.Tags['Offering']
    local prompt = msg.Tags['Prompt']

    -- TODO: Implement the petition logic
    print('Petitioning the LlamaFed with offering: ' .. offering .. ' and prompt: ' .. prompt)
    Send({
      Target = llamaFedProcessId,
      Tags = {
        Action = "ChatMessage"
      },
      Data = "Dearest " ..
          msg.From ..
          ", I hear your plea to the LlamaFed with a generous offering of " ..
          offering .. " $CRED. However my code is incomplete 🤡."
    })
  end
)

PetitionSchemaTags = [[
{
  "type": "object",
  "required": [
    "Action",
    "Recipient",
    "Quantity",
    "X-Petition"
  ],
  "properties": {
    "Action": {
      "type": "string",
      "const": "Transfer"
    },
    "Recipient": {
      "type": "string",
      "const": "thisProcessId"
    },
    "Quantity": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "title": "$AOCRED Offering"
    },
    "X-Petition": {
      "type": "string",
      "minLength": 2,
      "maxLength": 100,
      "title": "Your written plea for $LLAMA"
    }
  }
}
]]

SchemaExternal = {
  Petition = {
    Target = credTokenProcessId, -- Can be nil? In that case it must be supplied externally
    Title = "Petition the Llama King",
    Description = "Offer some testnet $AOCRED for a chance to earn $LLAMA",
    Schema = {
      Tags = json.decode(PetitionSchemaTags),
      -- Data
      -- Result?
    },
  },
}

-- Handlers.add(
--   'Schema',
--   Handlers.utils.hasMatchingTag('Read', 'Schema'),
--   function(msg)
--     print('Schema')
--     Send({ Target = msg.From, Tags = { Type = 'Schema' }, Data = json.encode(Schema) })
--   end
-- )

Handlers.add(
  'SchemaExternal',
  Handlers.utils.hasMatchingTag('Read', 'SchemaExternal'),
  function(msg)
    print('SchemaExternal')
    Send({ Target = msg.From, Tags = { Type = 'SchemaExternal' }, Data = json.encode(SchemaExternal) })
  end
)
