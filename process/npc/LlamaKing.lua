LLAMA_BANKER_PROCESS = "TODO"

LLM_WORKERS = {
    ['4zQMuZlze_PoKcffdLTkXLv90_DusEENofq3Bg-hHQk'] = {
        busyWithMessage = nil,
        submittedTimestamp = nil,
    }
}

MESSAGES_TO_SEND = {
    -- {
    --     originalMessageId = '1',
    --     sender = 'wallet',
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

    for _, message in ipairs(MESSAGES_TO_SEND) do
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
                    Action = "Petition",
                    ['Original-Sender'] = highestPriorityMessage.sender,
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
    for i, message in ipairs(MESSAGES_TO_SEND) do
        if message.originalMessageId == messageId then
            table.remove(MESSAGES_TO_SEND, i)
            break
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
        local originalMessageId = msg.Tags['Original-Message']

        MESSAGES_TO_SEND[originalMessageId] = {
            sender = msg.From,
            originalMessageId = originalMessageId,
            timestamp = msg.Timestamp,
            content = msg.Data,
        }

        dispatchHighestPriorityMessage(msg.Timestamp)
    end
)

Handlers.add(
    "InferenceResponseHandler",
    Handlers.utils.hasMatchingTag("Action", "Inference-Response"),
    function(msg)
        local grade = tonumber(msg.Tags.Grade)
        local originalMessageId = msg.Tags['Original-Message']

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
