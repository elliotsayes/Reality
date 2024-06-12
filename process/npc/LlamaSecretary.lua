LLAMA_TOKEN_PROCESS = "jKEUaDrcqp_m8YolY4ie5YxVTYBS74Pg-1zM6Hczw5I"
HOURLY_EMISSION_LIMIT = 1000000
AOCREDITS_PROCESS = "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc"
GATHER_PROCESS = "IoKrjjVCSvz2MTyUrZlI5Q06c7Bk29QcL6xpQzxjSHg"

MESSAGES_TO_SEND = {
    -- {
    --     originalMessageId = '1',
    --     sender = 'wallet',
    --     amount = 100,
    --     content = "I want a grant for xyz",
    -- }
}

LLAMAS = {
    ['4zQMuZlze_PoKcffdLTkXLv90_DusEENofq3Bg-hHQk'] = {
        busyWithMessage = nil,
        submittedTimestamp = nil,
    }
}

EMISSIONS = {}

JSON = require("json")

function removeMessageAndResetLlama(messageId)
    for i, message in ipairs(MESSAGES_TO_SEND) do
        if message.originalMessageId == messageId then
            table.remove(MESSAGES_TO_SEND, i)
            break
        end
    end
    
    for llamaId, llama in pairs(LLAMAS) do
        if llama.busyWithMessage == messageId then
            llama.busyWithMessage = nil
            llama.submittedTimestamp = nil
            break
        end
    end
end

function clearOldEmissions(currentTime)
    for i = #EMISSIONS, 1, -1 do
        if currentTime - EMISSIONS[i].timestamp > 6 * 3600 then
            table.remove(EMISSIONS, i)
        end
    end
end

function processCreditNotice(msg)
    local messageId = msg.Id
    local sender = msg.Sender
    local amount = msg.Quantity
    local content = msg['Petition']
    table.insert(MESSAGES_TO_SEND, {
        originalMessageId = messageId,
        sender = sender,
        amount = tonumber(amount),
        content = content
    })
end

function calculateEmissions(grade, currentTime)
    local totalEmissions = 0

    local adjustment = 1
    local latestEmission = EMISSIONS[#EMISSIONS] or {amount = 0, timestamp = 0}
    if latestEmission.timestamp + 3600 > currentTime then
        for i, emission in ipairs(EMISSIONS) do
            if currentTime - emission.timestamp <= 3600 then
                totalEmissions = totalEmissions + emission.amount
            end
        end
        adjustment = HOURLY_EMISSION_LIMIT / math.max(HOURLY_EMISSION_LIMIT/100, totalEmissions) -- 10k
    end
    return 100 * grade * adjustment
end

function sendLlamaToken(amount, recipient, currentTime)
    ao.send({
        Target = LLAMA_TOKEN_PROCESS,
        Action = "Transfer",
        Recipient = recipient,
        Quantity = tostring(amount)
    })
    table.insert(EMISSIONS, {
        amount = amount,
        recipient = recipient,
        timestamp = currentTime
    })
end


function clearExpiredLlamas(currentTime)
    for llamaId, llama in pairs(LLAMAS) do
        if llama.busyWithMessage and currentTime - llama.submittedTimestamp >= 600 then
            llama.busyWithMessage = nil
            llama.submittedTimestamp = nil
        end
    end
end

function isMessageProcessing(messageId)
    for llamaId, llama in pairs(LLAMAS) do
        if llama.busyWithMessage == messageId then
            return true
        end
    end
    return false
end

function getHighestPriorityUnprocessedMessage()
    table.sort(MESSAGES_TO_SEND, function(a, b) return a.amount > b.amount end)
    
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
        
        for llamaId, llama in pairs(LLAMAS) do
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
        
        if not llamaFound then
            table.insert(MESSAGES_TO_SEND, 1, highestPriorityMessage)
        end
    end
end



Handlers.add(
    "CreditNoticeHandler",
    Handlers.utils.hasMatchingTag("Action", "Credit-Notice"),
    function (msg)
        if msg.From == AOCREDITS_PROCESS then
            processCreditNotice(msg)
            dispatchHighestPriorityMessage(msg.Timestamp)
        end
    end
)


Handlers.add(
    "LlamaResponseHandler",
    Handlers.utils.hasMatchingTag("Action", "Llama-Response"),
    function (msg)
        local grade = tonumber(msg.Grade)
        local recipient = msg['Original-Sender']
        local originalMessageId = msg['Original-Message']
    
        local tokenAmount = calculateEmissions(grade, msg.Timestamp)
        sendLlamaToken(tokenAmount, recipient, msg.Timestamp)
        removeMessageAndResetLlama(originalMessageId)

        local gatherMessage = {
            worldId = 'LlamaFED',
            type = 'text',
            created = msg.Timestamp,
            dm = true,
            author = ao.id,
            textOrTxId = 'You have been granted ' .. tokenAmount .. ' Llama tokens.'
        }

        ao.send({
            Target = GATHER_PROCESS,
            Action = "CreatePost",
            DM = recipient,
            Data = JSON.encode(gatherMessage)
        })
        ao.send({
            Target = recipient,
            Action = "Llama-Success",
            Data = 'You have been granted ' .. tokenAmount .. ' Llama tokens.'
        })
        dispatchHighestPriorityMessage(msg.Timestamp)
    end
)


Handlers.add(
    "CronHandler",
    Handlers.utils.hasMatchingTag("Action", "Cron-Tick"),
    function (msg)
        clearOldEmissions(msg.Timestamp)
        clearExpiredLlamas(msg.Timestamp)
    end
)