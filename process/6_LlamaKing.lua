ModelID = "ISrbGzQot05rs_HKC08O_SmkipYQnqgB1yC3mjZZeEo"
Llama = nil
MaxResponse = 50
Personality =
    "You are a Llama king of a kingdom. " ..
    "You are a good king and you really like grass."

function Init(ModelID)
    Llama = require("llama")
    Llama.logLevel = 4
    Llama.load(ModelID)
end

function ProcessPetition(petition)
    Llama.setPrompt(GeneratePrompt(petition))
    local response = ""
    for i = 1, MaxResponse do
        response = Llama.next()
        local match = string.match(response, "GRADE:%s*(%d+)")
        if match then
            return match, response
        end
    end
end

function GeneratePrompt(petition)
    return "<|SYSTEM|>" ..
        Personality .. "<|USER|>" ..
        petition .. "<|ASSISTANT|>"
end

Handlers.add(
    "Init",
    Handlers.utils.hasMatchingTag("Action", "Init"),
    function(msg)
        Personality = msg.Personality or Personality
        MaxResponse = msg["Max-Response"] or MaxResponse
        ModelID = msg["Model-ID"] or ModelID
        Init(ModelID)

        Send({
            Action = "King-Initialized",
            Personality = Personality
        })
    end
)

Handlers.add(
    "Petition",
    Handlers.utils.hasMatchingTag("Action", "Petition"),
    function(msg)
        --local Grade, Reason = ProcessPetition(msg.Text)
        ao.send({
            Target = msg.From,
            Action = "Llama-Response",
            Grade = "10",
            Reason = "I like grass",
            ["Original-Sender"] = msg["Original-Sender"],
            ["Original-Message"] = msg["Original-Message"],
        })
    end
)