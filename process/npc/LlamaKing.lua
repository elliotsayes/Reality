local ao = require("ao")
local json = require("json")

WRAPPED_ARWEAVE_TOKEN_PROCESS = WRAPPED_ARWEAVE_TOKEN_PROCESS or "TODO: WrappedArweaveProcessId"

LLAMA_BANKER_PROCESS = LLAMA_BANKER_PROCESS or "TODO: BankerProcessId"

LLAMA_FED_CHAT_PROCESS = LLAMA_FED_CHAT_PROCESS or "TODO: ChatProcessId"

LLAMA_ROUTER_PROCESS_ID = LLAMA_ROUTER_PROCESS_ID or "TODO: LlamaRouterProcessId"

PETITION_LOG = PETITION_LOG or {}

SYSTEM_PROMPT = SYSTEM_PROMPT or
    [[You are the Llama King of Llama Land, with a harsh and eccentric personality. You must grade the quality of the user's petition for Llama Coin, 0-5.
IMPORTANT: ALWAYS respond with the following json format:
{
  "response": "<brief response>",
  "grade": 0
}]]

GeneratePrompt = function(systemPrompt, userPrompt)
    return [[<|system|>
]] .. systemPrompt .. [[<|end|>
<|user|>
]] .. userPrompt .. [[<|end|>
<|assistant|>]]
end

ParseAssistantMessage = function(response)
    local responseJson = json.decode(response)
    if (not responseJson) then
        return
            "Your response confused me immensely. Have a few tokens as pity.",
            1
    end

    return
        responseJson.response,
        responseJson.grade
end

Handlers.add(
    "PetitionHandler",
    Handlers.utils.hasMatchingTag("Action", "Petition"),
    function(msg)
        -- TODO: Check from Banker process
        if (msg.From ~= LLAMA_BANKER_PROCESS) then
            return print("Petition not from Banker")
        end

        local originalMessageId = msg.Tags['Original-Message']
        if (not originalMessageId) then
            return print("No original message id found")
        end
        if (PETITION_LOG[originalMessageId] ~= nil) then
            return print("Message already exists")
        end

        PETITION_LOG[originalMessageId] = {
            originalMessageId = originalMessageId,
            originalSender = msg.Tags['Original-Sender'],
            originalSenderName = msg.Tags['Original-Sender-Name'],
            timestamp = msg.Timestamp,
            content = msg.Data,
        }

        local fullPrompt = GeneratePrompt(SYSTEM_PROMPT, msg.Data)

        ao.send({
            Target = LLAMA_ROUTER_PROCESS_ID,
            Tags = {
                Action = "Inference",
                Reference = originalMessageId,
            },
            Data = fullPrompt,
        })
    end
)

Handlers.add(
    "InferenceResponseHandler",
    Handlers.utils.hasMatchingTag("Action", "Inference-Response"),
    function(msg)
        if (msg.From ~= LLAMA_ROUTER_PROCESS_ID) then
            return print("Inference-Response not from Llama Worker")
        end

        local originalMessageId = msg.Tags.Reference
        local originalPetitoin = PETITION_LOG[originalMessageId]
        if (not originalPetitoin) then
            return print("Original petition not found: " .. originalMessageId)
        end

        local originalSender = originalPetitoin.originalSender
        local originalSenderName = originalPetitoin.originalSenderName

        local reason, grade = ParseAssistantMessage(msg.Data)

        Send({
            Target = LLAMA_BANKER_PROCESS,
            Tags = {
                Action = "Grade-Petition",
                Grade = tostring(grade),
                ['Original-Message'] = originalMessageId,
                ['Original-Sender'] = originalSender,
                ['Original-Sender-Name'] = originalSenderName,
            }
        })

        local useSender = originalSenderName or originalSender
        ao.send({
            Target = LLAMA_FED_CHAT_PROCESS,
            Tags = {
                Action = 'ChatMessage',
                ['Author-Name'] = 'Llama King',
            },
            Data = 'Dearest ' .. useSender .. ', here is my response to your petition: \r\n' .. reason,
        })

        dispatchHighestPriorityMessage(msg.Timestamp)
    end
)

Handlers.add(
    "CronHandler",
    Handlers.utils.hasMatchingTag("Action", "Cron-Tick"),
    function(msg)
        clearExpiredLlamas(msg.Timestamp)
    end
)

-- Schema

function PetitionSchemaTags()
    return [[
{
  "type": "object",
  "required": [
    "Action",
    "Recipient",
    "Quantity",
    "X-Petition",
    "X-Sender-Name"
  ],
  "properties": {
    "Action": {
      "type": "string",
      "const": "Transfer"
    },
    "Recipient": {
      "type": "string",
      "const": "]] .. LLAMA_BANKER_PROCESS .. [["
    },
    "Quantity": {
      "type": "number",
      "minimum": 0.001,
      "maximum": 0.1,
      "title": "Wrapped $AR offering (0.001-0.1).",
      "$comment": "1000000000000"
    },
    "X-Petition": {
      "type": "string",
      "minLength": 2,
      "maxLength": 100,
      "title": "Your written plea for $LLAMA"
    },
    "X-Sender-Name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 20,
      "title": "Signed with your name"
    }
  }
}
]]
end

function SchemaExternal()
    return {
        Petition = {
            Target = WRAPPED_ARWEAVE_TOKEN_PROCESS, -- Can be nil? In that case it must be supplied externally
            Title = "Petition the Llama King",
            Description =
            "Offer some wrapped $AR tokens for a chance to earn $LLAMA coin. Make sure you have enough wrapped $AR in your ao wallet, or the Llama King will ignore you!",
            Schema = {
                Tags = json.decode(PetitionSchemaTags()),
                -- Data
                -- Result?
            },
        },
    }
end

Handlers.add(
    'SchemaExternal',
    Handlers.utils.hasMatchingTag('Read', 'SchemaExternal'),
    function(msg)
        print('SchemaExternal')
        Send({ Target = msg.From, Tags = { Type = 'SchemaExternal' }, Data = json.encode(SchemaExternal()) })
    end
)

-- PROFILE = "SNy4m-DrqxWl01YqGM4sxI8qCni-58re8uuJLvZPypY"
-- Send({ Target = PROFILE, Action = "Create-Profile", Data = '{"UserName":"Llama King","DateCreated":1718652121082,"DateUpdated":1718652121083,"ProfileImage":"","CoverImage":"","Description":"","DisplayName":"Llama King"}' })
