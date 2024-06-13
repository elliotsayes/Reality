local json = require("json")

LLAMA_BANKER_PROCESS = "TODO: BankerProcessId"

LLM_WORKERS = {
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
            timestamp = msg.Timestamp,
            content = msg.Data,
        }

        -- print(json.encode(MESSAGES_TO_SEND))

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
        local originalMessageId = msg.Tags['Original-Message']
        if (not originalMessageId) then
            return print("No original message id found")
        end
        if (not MESSAGES_TO_SEND[originalMessageId]) then
            return print("Message not found")
        end

        removeMessageAndResetLlama(originalMessageId)

        -- TODO: Chat message

        ao.send({
            Target = LLAMA_BANKER_PROCESS,
            Tags = {
                Action = "Grade-Petition",
                Grade = tostring(grade),
                ['Original-Sender'] = msg.Tags['Original-Sender'],
                ['Original-Message'] = msg.Tags['Original-Message'],
            }
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
