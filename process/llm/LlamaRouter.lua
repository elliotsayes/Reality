-- A simple LLM router using Llama-Herder for inference.
-- setup: aos> .load-blueprint apm
--        aos> APM.install('@sam/Llama-Herder')

if not APM then
    print("Requires APM in order to run. Execute `.load-blueprint apm` to install.")
    return
end

if not Llama then
    print("Requires Llama-Herder in order to run. Execute `APM.install('@sam/Llama-Herder')` to install.")
end

local ao = require('ao')
local json = require('json')

LlamaRouter = LlamaRouter or {}
LlamaRouter.LlamaHerderProcessId = LlamaRouter.LlamaHerderProcessId or 'TODO: LlamaHerderProcessId'
LlamaRouter.LlamaHerderTokenProcessId = LlamaRouter.LlamaHerderTokenProcess or 'TODO: LlamaHerderTokenProcess'
LlamaRouter.InferenceAllowList = {
    -- ["<some processId>"] = true,
}
LlamaRouter.Routes = LlamaRouter.Routes or {
    -- ReferenceId = { -- Internal ReferenceId, recieved message
    --     ReplyTo = "<some processId, defaults to sender>"",
    --     ReplyReferenceId = "<some referenceId, defaults to nil>",
    -- }
}
-- LlamaRouter.GeneratePrompt = function(systemPrompt, userPrompt)
--     return [[<|system|>
-- ]] .. systemPrompt .. [[<|end|>
-- <|user|>
-- ]] .. userPrompt .. [[<|end|>
-- <|assistant|>]]
-- end

Handlers.add(
    "LlamaRouter.Inference",
    Handlers.utils.hasMatchingTag("Action", "Inference"),
    function(msg)
        print("LlamaRouter.Inference")

        -- Whitelist
        if not InferenceAllowList[msg.From] then
            print("Inference not allowed: " .. msg.From)
            return
        end

        local routerReference = msg.Id
        local clientReference = msg.Tags.Reference
        local replyTo = msg.Tags['Reply-To'] or msg.From
        local tokens = tonumber(msg.Tags.Tokens) or 10
        local prompt = msg.Data

        LlamaRouter.Routes[routerReference] = {
            ReplyTo = replyTo,
            ReplyReferenceId = clientReference,
        }

        Llama.run(
            prompt,
            tokens,
            LlamaRouter.InferenceResponseHandler,
            {},
            routerReference
        )
    end
)

function LlamaRouter.InferenceResponseHandler(_, msg)
    print("LlamaRouter.InferenceResponseHandler")

    local referenceId = msg.Tags['X-Reference']
    local route = LlamaRouter.Routes[referenceId]
    if not route then
        print("No route in RouteTable for referenceId: " .. referenceId)
        return
    end

    ao.Send({
        Target = route.ReplyTo,
        Tags = {
            Action = "Inference-Response",
            Reference = route.ReplyReferenceId,
        },
        Data = msg.Data,
    })

    LlamaRouter.Routes[referenceId] = nil
end

return print('Loaded LlamaRouter')
