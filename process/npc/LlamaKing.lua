local ao = require("ao")
local json = require("json")
local sqlite3 = require('lsqlite3')

WAITLIST_PROCESS = WAITLIST_PROCESS or "2dFSGGlc5xJb0sWinAnEFHM-62tQEbhDzi1v5ldWX5k"

KingDb = KingDb or sqlite3.open_memory()
KingDbAdmin = KingDbAdmin or require('DbAdmin').new(KingDb)

SQLITE_TABLE_AUTHORISED = [[
  CREATE TABLE IF NOT EXISTS Authorised (
    WalletId TEXT PRIMARY KEY,
    Timestamp INTEGER
  );
]]

function InitDb()
    KingDb:exec(SQLITE_TABLE_AUTHORISED)
end

KingInitialized = KingInitialized or false
if (not KingInitialized) then
    InitDb()
    KingInitialized = true
end

function AuthoriseWallet(walletId, timestamp)
    print("Authorising: " .. walletId)
    if timestamp == nil then
        timestamp = 0
    end
    local stmt = KingDb:prepare("INSERT INTO Authorised (WalletId, Timestamp) VALUES (?, ?)")
    stmt:bind_values(walletId, timestamp)
    stmt:step()
    stmt:finalize()
end

function UnauthoriseWallet(walletId)
    print("Unauthorising: " .. walletId)
    local stmt = KingDb:prepare("DELETE FROM Authorised WHERE WalletId = ?")
    stmt:bind_values(walletId)
    stmt:step()
    stmt:finalize()
end

function IsAuthorised(walletId)
    local authorised = KingDbAdmin:exec(
        "SELECT * FROM Authorised WHERE WalletId = '" .. walletId .. "'"
    )
    return #authorised > 0
end

Handlers.add(
    "Authorise",
    Handlers.utils.hasMatchingTag("Action", "Authorise"),
    function(msg)
        print("Authorise")
        if msg.From ~= WAITLIST_PROCESS then
            return print("Authorise not from WaitlistProcessId")
        end

        local walletId = msg.Tags.WalletId

        if (IsAuthorised(walletId)) then
            return print("Already Authorised: " .. walletId)
        end

        AuthoriseWallet(walletId, msg.Timestamp)
    end
)

LLAMA_TOKEN_PROCESS = "pazXumQI-HPH7iFGfTC-4_7biSnqz_U67oFAGry5zUY"
LLAMA_DENOMINATION = 12
LLAMA_MULTIPLIER = 10 ^ LLAMA_DENOMINATION

LLAMA_MINIMUM_QUANTITY_WHOLE = 1
LLAMA_MAXIMUM_QUANTITY_WHOLE = 1

LLAMA_BANKER_PROCESS = LLAMA_BANKER_PROCESS or "TODO: BankerProcessId"

LLAMA_FED_CHAT_PROCESS = LLAMA_FED_CHAT_PROCESS or "TODO: ChatProcessId"

LLM_WORKERS = LLM_WORKERS or {
    -- ['FAKEWORKER2'] = {
    --     busyWithMessage = nil,
    --     submittedTimestamp = nil,
    -- }
}

MESSAGES_TO_PROCESS = MESSAGES_TO_PROCESS or {
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
        if llama.busyWithMessage and (llama.submittedTimestamp == nil or ((currentTime - llama.submittedTimestamp) >= 600000)) then
            print("Llama " .. llamaId .. " is expired!")
            llama.busyWithMessage = "TIMEOUT"
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
    table.sort(MESSAGES_TO_PROCESS, function(a, b) return a.timestamp < b.timestamp end)

    for _, message in pairs(MESSAGES_TO_PROCESS) do
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

        local useSender = highestPriorityMessage.originalSenderName or highestPriorityMessage.originalSender
        if not llamaFound then
            print("No available Llama workers")
            ao.send({
                Target = LLAMA_FED_CHAT_PROCESS,
                Tags = {
                    Action = 'ChatMessage',
                    ['Author-Name'] = 'Llama King',
                    Recipient = highestPriorityMessage.originalSender,
                },
                Data = "Oh dear " .. useSender .. ", I'm terribly busy! I'll get to your recipe in due time..."
            })
        end
    end
end

function removeMessageAndResetLlama(messageId)
    for _, message in pairs(MESSAGES_TO_PROCESS) do
        if message.originalMessageId == messageId then
            MESSAGES_TO_PROCESS[message.originalMessageId] = nil
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
        if (MESSAGES_TO_PROCESS[originalMessageId] ~= nil) then
            return print("Message already exists")
        end

        local messageToSend = {
            originalMessageId = originalMessageId,
            originalSender = msg.Tags['Original-Sender'],
            originalSenderName = msg.Tags['Original-Sender-Name'],
            timestamp = msg.Timestamp,
            content = msg.Data,
        }

        MESSAGES_TO_PROCESS[originalMessageId] = messageToSend

        local useSender = messageToSend.originalSenderName or messageToSend.originalSender
        ao.send({
            Target = LLAMA_FED_CHAT_PROCESS,
            Tags = {
                Action = 'ChatMessage',
                ['Author-Name'] = 'Llama King',
                Recipient = messageToSend.originalSender,
            },
            Data = 'Ah, my loyal subject ' ..
                useSender .. ', please allow me several minutes to try baking your delicious pie recipe...',
        })

        dispatchHighestPriorityMessage(msg.Timestamp)
    end
)

function isLlmWorker(processId)
    return LLM_WORKERS[processId] ~= nil
end

Handlers.add(
    "InferenceCommentHandler",
    Handlers.utils.hasMatchingTag("Action", "Inference-Comment"),
    function(msg)
        if (not isLlmWorker(msg.From)) then
            return print("Not a Llama Worker")
        end

        local comment = msg.Data
        local originalMessageId = msg.Tags['Original-Message']
        if (not originalMessageId) then
            return print("No original message id found")
        end
        if (not MESSAGES_TO_PROCESS[originalMessageId]) then
            return print("Message not found: " .. (originalMessageId or '<nil>'))
        end

        local originalSender = MESSAGES_TO_PROCESS[originalMessageId].originalSender
        local originalSenderName = MESSAGES_TO_PROCESS[originalMessageId].originalSenderName

        local useSender = originalSenderName or originalSender
        ao.send({
            Target = LLAMA_FED_CHAT_PROCESS,
            Tags = {
                Action = 'ChatMessage',
                ['Author-Name'] = 'Llama King',
            },
            Data = 'Attention ' ..
                useSender ..
                ', witness my response to your recipe: \r\n' ..
                comment .. '\r\nThe Llama Banker will arrange your payment shortly 🦙🤝🪙',
        })
    end
)

Handlers.add(
    "InferenceResponseHandler",
    Handlers.utils.hasMatchingTag("Action", "Inference-Response"),
    function(msg)
        if (not isLlmWorker(msg.From)) then
            return print("Not a Llama Worker")
        end

        local grade = msg.Tags.Grade
        local reason = msg.Data
        local originalMessageId = msg.Tags['Original-Message']
        if (not originalMessageId) then
            return print("No original message id found")
        end
        if (not MESSAGES_TO_PROCESS[originalMessageId]) then
            return print("Message not found: " .. (originalMessageId or '<nil>'))
        end

        local originalSender = MESSAGES_TO_PROCESS[originalMessageId].originalSender
        local originalSenderName = MESSAGES_TO_PROCESS[originalMessageId].originalSenderName

        removeMessageAndResetLlama(originalMessageId)

        ao.send({
            Target = LLAMA_BANKER_PROCESS,
            Tags = {
                Action = "Grade-Petition",
                Grade = grade,
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
            Data = 'Attention ' .. useSender .. ', witness my response to your recipe: \r\n' .. reason,
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
      "default": ]] .. LLAMA_MINIMUM_QUANTITY_WHOLE .. [[,
      "minimum": ]] .. LLAMA_MINIMUM_QUANTITY_WHOLE .. [[,
      "maximum": ]] .. LLAMA_MAXIMUM_QUANTITY_WHOLE .. [[,
      "title": "$LLAMA offering (1).",
      "$comment": "1000000000000"
    },
    "X-Petition": {
      "type": "string",
      "minLength": 2,
      "maxLength": 250,
      "title": "Write the best recipe to earn the most possible $LLAMA Coin!",
      "description": "Max 250 characters"
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

function SchemaExternalHasWar()
    return {
        Petition = {
            Target = LLAMA_TOKEN_PROCESS, -- Can be nil? In that case it must be supplied externally
            Title = "Earn $LLAMA from the King!",
            Description =
            "The Llama King is looking for the best Pie recipe in the kingdom! Submit your recipe to earn $LLAMA.",
            Schema = {
                Tags = json.decode(PetitionSchemaTags()),
                -- Data
                -- Result?
            },
        },
    }
end

Handlers.add(
    'TokenBalanceResponse',
    function(msg)
        local fromToken = msg.From == LLAMA_TOKEN_PROCESS
        local hasBalance = msg.Tags.Balance ~= nil
        return fromToken and hasBalance
    end,
    function(msg)
        local account = msg.Tags.Account
        local balance = tonumber(msg.Tags.Balance)
        print('Account: ' .. account .. ', Balance: ' .. balance)

        if (balance >= (LLAMA_MULTIPLIER * 0.001)) then
            Send({ Target = account, Tags = { Type = 'SchemaExternal' }, Data = json.encode(SchemaExternalHasWar()) })
        else
            Send({
                Target = account,
                Tags = { Type = 'SchemaExternal' },
                Data = json.encode({
                    Petition = {
                        Target = LLAMA_TOKEN_PROCESS, -- Can be nil? In that case it must be supplied externally
                        Title = "Beg the King for $LLAMA",
                        Description =
                            "You don't have enough $LLAMA to offer the Llama King! You need at least " ..
                            LLAMA_MINIMUM_QUANTITY_WHOLE ..
                            " $LLAMA. Go to bazar.arweave.net or permaswap.network to get some.",
                        Schema = nil,
                    },
                })
            })
        end
    end
)

Handlers.add(
    'SchemaExternal',
    Handlers.utils.hasMatchingTag('Action', 'SchemaExternal'),
    function(msg)
        print('SchemaExternal')
        -- Poke the Llama King
        dispatchHighestPriorityMessage(msg.Timestamp)
        if (IsAuthorised(msg.From)) then
            Send({
                Target = LLAMA_TOKEN_PROCESS,
                Tags = {
                    Action = 'Balance',
                    Recipient = msg.From,
                },
            })
        else
            Send({
                Target = msg.From,
                Tags = { Type = 'SchemaExternal' },
                Data = json.encode({
                    Petition = {
                        Target = LLAMA_TOKEN_PROCESS,
                        Title = "Beg the King for $LLAMA",
                        Description =
                        "The Llama King only has time for his loyal citizens! Speak with the Citizenship Llama to to learn more.",
                        Schema = nil,
                    },
                })
            })
        end
    end
)

-- PROFILE = "SNy4m-DrqxWl01YqGM4sxI8qCni-58re8uuJLvZPypY"
-- Send({ Target = PROFILE, Action = "Create-Profile", Data = '{"UserName":"Llama King","DateCreated":1718652121082,"DateUpdated":1718652121083,"ProfileImage":"","CoverImage":"","Description":"","DisplayName":"Llama King"}' })

Handlers.add(
    "Poke",
    Handlers.utils.hasMatchingTag("Action", "Poke"),
    function(msg)
        print("Poke")
        dispatchHighestPriorityMessage(msg.Timestamp)
    end
)
