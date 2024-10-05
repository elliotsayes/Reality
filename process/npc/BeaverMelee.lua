-- Name: CyberBeaverMelee
-- ProcessId: _bXCnR0M2ScWZa8oFr-PqsaV9CELacwkV9Nw9GGYY44

local json = require('json')

TARGET_WORLD_PID = "9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss"

PopupTexts = { [[
Greetings, Llama! I'm the Cyberbeaver Envoy in Llamaland. Ready to join the ranks of the Cyberbeaver Legion and conquer the digital frontier?
Expect brutal challenges, a dystopian future, and cyberpunk chaos—but you could walk away with wARs, Trunks, tIOs, CBCs, and more.
]], [[
Hey there, Llama! I’m the Cyberbeaver Envoy from Llamaland. Ready to become part of the Cyberbeaver Legion? It’s time to gear up and dive into the cyberpunk wilderness.
Be warned: pain, death, and chaos await you, but so do wARs, Trunks, tIOs, CBCs, and more valuable loot.
]], [[
Hail, Llama! I’m Cyberbeaver Envoy, your guide into the cyberpunk abyss. Want to join our relentless Cyberbeaver Legion and carve your path to glory?
Prepare for pain, darkness, and twisted battles. But victory may bring you wARs, Trunks, tIOs, CBCs, and more.
]], [[
Hello, Llama! I am the Cyberbeaver Envoy here in Llamaland. Do you have what it takes to join the Cyberbeaver Legion and embrace the chaos?
Pain, destruction, and a bleak cyberpunk reality await—but so do wARs, Trunks, tIOs, CBCs, and more.
]], [[
Hey Llama, I’m the Cyberbeaver Envoy in Llamaland! Want to join the elite Cyberbeaver Legion and dominate the cyberpunk future?
Pain, death, and cyber-darkness lie ahead—but so do wARs, Trunks, tIOs, CBCs, and other rewards.
]] }

LinkTexts = { [[
Head to https://beavers.warp.cc or jump into our Discord at https://discord.gg/aMF724nF to enlist!
Time to enlist, Llama. Are you in?
]], [[
Sign up at https://beavers.warp.cc or join us on Discord at https://discord.gg/aMF724nF.
Enlist today. Your dystopian future begins now, Llama!
]], [[
Start your journey at https://beavers.warp.cc or come to our Discord at https://discord.gg/aMF724nF.
Join the Legion now, Llama. Adventure awaits!
]], [[
Sign up now at https://beavers.warp.cc or join the fight on Discord: https://discord.gg/aMF724nF.
Enlist today, Llama. The Legion needs you.
]], [[
Go to https://beavers.warp.cc or hit up our Discord at https://discord.gg/aMF724nF to enlist!
Enlist now, Llama. The fight is waiting for you!
]] }

Handlers.add(
  "PlayBeavers",
  Handlers.utils.hasMatchingTag("Action", "PlayBeavers"),
  function(msg)
    print("PlayBeavers")
    local seed = msg.Timestamp
    Send({
      Target = TARGET_WORLD_PID,
      Tags = {
        Action = "ChatMessage",
        ['Author-Name'] = 'Cyberbeaver Envoy',
      },
      Data = LinkTexts[seed % #LinkTexts + 1]
    })
  end
)
function PlayBeaversSchemaTags()
  return [[
{
"type": "object",
"required": [
  "Action"
],
"properties": {
  "Action": {
    "type": "string",
    "const": "PlayBeavers"
  },
}
}
]]
end

function SchemaPlayBeavers(msg)
  local seed = msg.Timestamp
  return {
    PlayBeavers = {
      Title = "Cyberbeaver Envoy",
      Description = PopupTexts[seed % #PopupTexts + 1] .. " ...Click to learn more!",
      Schema = {
        Tags = json.decode(PlayBeaversSchemaTags()),
        -- Data
        -- Result?
      },
    },
  }
end

Handlers.add(
  'Schema',
  Handlers.utils.hasMatchingTag('Action', 'Schema'),
  function(msg)
    print('Schema')
    Send({
      Target = msg.From,
      Tags = { Type = 'Schema' },
      Data = json.encode(SchemaPlayBeavers(msg))
    })
  end
)
