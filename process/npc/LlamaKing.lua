local ao = require("ao")
local json = require("json")

WRAPPED_ARWEAVE_TOKEN_PROCESS = WRAPPED_ARWEAVE_TOKEN_PROCESS or "TODO: WrappedArweaveProcessId"

LLAMA_BANKER_PROCESS = LLAMA_BANKER_PROCESS or "TODO: BankerProcessId"

LLAMA_FED_CHAT_PROCESS = LLAMA_FED_CHAT_PROCESS or "TODO: ChatProcessId"

LLM_WORKERS = LLM_WORKERS or {
    ['4zQMuZlze_PoKcffdLTkXLv90_DusEENofq3Bg-hHQk'] = {
        busyWithMessage = nil,
        submittedTimestamp = nil,
    },
    ['FAKEWORKER2'] = {
        busyWithMessage = nil,
        submittedTimestamp = nil,
    }
}

MESSAGES_TO_SEND = {
    -- [oriingalMessageId] = {
    --     originalMessageId = '1',
    --     originalSender = 'wallet',
    --     originalSenderName = 'my name', -- TODO
    --     timestamp = 0,
    --     content = "I want a grant for xyz",
    -- }
}

function clearExpiredLlamas(currentTime)
    for llamaId, llama in pairs(LLM_WORKERS) do
        if llama.busyWithMessage and currentTime - llama.submittedTimestamp >= 600 then
            llama.busyWithMessage = nil
            llama.submittedTimestamp = nil
        end
    end
end

function isMessageProcessing(messageId)
    for llamaId, llama in pairs(LLM_WORKERS) do
        if llama.busyWithMessage == messageId then
            return true
        end
    end
    return false
end

function getHighestPriorityUnprocessedMessage()
    table.sort(MESSAGES_TO_SEND, function(a, b) return a.timestamp < b.timestamp end)

    for _, message in pairs(MESSAGES_TO_SEND) do
        if not isMessageProcessing(message.originalMessageId) then
            return message
        end
    end

    return nil
end

function dispatchHighestPriorityMessage(currentTime)
    clearExpiredLlamas(currentTime)

    local highestPriorityMessage = getHighestPriorityUnprocessedMessage()
    if highestPriorityMessage then
        local messageId = highestPriorityMessage.originalMessageId
        local llamaFound = false

        for llamaId, llama in pairs(LLM_WORKERS) do
            if not llama.busyWithMessage then
                llama.busyWithMessage = messageId
                llama.submittedTimestamp = currentTime
                ao.send({
                    Target = llamaId,
                    Action = "Inference",
                    ['Original-Sender'] = highestPriorityMessage.originalSender,
                    ['Original-Message'] = highestPriorityMessage.originalMessageId,
                    Data = highestPriorityMessage.content
                })
                llamaFound = true
                break
            end
        end

        -- TODO: Check if this is correct? Shouldn't we have to delete it rather than reinserting it?
        if not llamaFound then
            table.insert(MESSAGES_TO_SEND, 1, highestPriorityMessage)
        end
    end
end

function removeMessageAndResetLlama(messageId)
    for _, message in pairs(MESSAGES_TO_SEND) do
        if message.originalMessageId == messageId then
            MESSAGES_TO_SEND[message.originalMessageId] = nil
        end
    end

    for llamaId, llama in pairs(LLM_WORKERS) do
        if llama.busyWithMessage == messageId then
            llama.busyWithMessage = nil
            llama.submittedTimestamp = nil
            break
        end
    end
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
        if (MESSAGES_TO_SEND[originalMessageId] ~= nil) then
            return print("Message already exists")
        end

        MESSAGES_TO_SEND[originalMessageId] = {
            originalMessageId = originalMessageId,
            originalSender = msg.Tags['Original-Sender'],
            originalSenderName = msg.Tags['Original-Sender-Name'],
            timestamp = msg.Timestamp,
            content = msg.Data,
        }

        dispatchHighestPriorityMessage(msg.Timestamp)
    end
)

function isLlmWorker(processId)
    return LLM_WORKERS[processId] ~= nil
end

Handlers.add(
    "InferenceResponseHandler",
    Handlers.utils.hasMatchingTag("Action", "Inference-Response"),
    function(msg)
        if (not isLlmWorker(msg.From)) then
            return print("Not a Llama Worker")
        end

        local grade = tonumber(msg.Tags.Grade)
        local reason = msg.Data
        local originalMessageId = msg.Tags['Original-Message']
        if (not originalMessageId) then
            return print("No original message id found")
        end
        if (not MESSAGES_TO_SEND[originalMessageId]) then
            return print("Message not found")
        end

        local originalSender = MESSAGES_TO_SEND[originalMessageId].originalSender
        local originalSenderName = MESSAGES_TO_SEND[originalMessageId].originalSenderName
        local useSender = originalSenderName or originalSender

        removeMessageAndResetLlama(originalMessageId)

        ao.send({
            Target = LLAMA_BANKER_PROCESS,
            Tags = {
                Action = "Grade-Petition",
                Grade = tostring(grade),
                ['Original-Message'] = originalMessageId,
                ['Original-Sender'] = originalSender,
                ['Original-Sender-Name'] = originalSenderName,
            }
        })

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
