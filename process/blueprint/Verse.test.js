import { test } from 'node:test'
import * as assert from 'node:assert'
import { Send } from '../aos.helper.js'
import fs from 'node:fs'

test('load DbAdmin module', async () => {
  const dbAdminCode = fs. readFileSync('./blueprint/DbAdmin.lua', 'utf-8')
  const result = await Send({
  Action: 'Eval',
  Data: `
local function _load()
  ${dbAdminCode}
end
_G.package.loaded["DbAdmin"] = _load()
return "ok"`,
  })
  assert.equal(result.Output.data.output, "ok")
})

test('load source', async () => {
  const code = fs.readFileSync('./blueprint/Verse.lua', 'utf-8')
  const result = await Send({ Action: "Eval", Data: code })

  assert.equal(result.Output.data.output, "Loaded Verse Protocol")
})

test('load llama island', async () => {
  const code = fs.readFileSync('./verse/3_LlamaLand.lua', 'utf-8')
  const result = await Send({ Action: "Eval", Data: code })

  assert.equal(result.Output.data.output, undefined)
})

test('check table exists', async () => {
  const result = await Send({
    Action: "Eval",
    Data: `require('json').encode(VerseDbAdmin:tables())`
  })

  assert.deepEqual(JSON.parse(result.Output.data.output), ["Entities"])
})

test('check Entities table empty', async () => {
  const result = await Send({
    Action: "Eval", 
    Data: `VerseDbAdmin:count('Entities')`
  })

  assert.deepEqual(result.Output.data.output, "0")
})

test('check VerseEntityCreate handler', async () => {
  const result = await Send({
    From: "TestOwner",
    Action: "VerseEntityCreate",
    Data: JSON.stringify({
      Type: "Avatar",
      Position: [1, 2],
    }),
  })

  assert.equal(result.Output.data, "VerseEntityCreate")

  const result2 = await Send({
    Action: "Eval",
    Data: `require('json').encode(VerseDbAdmin:exec('SELECT * FROM Entities')[1])`,
  })

  assert.deepEqual(JSON.parse(result2.Output.data.output), { Id: 'TestOwner', LastUpdated: 10003, Type: 'Avatar', Position: '[1,2]' })
})


test('check VerseEntityUpdatePosition handler', async () => {
  const result = await Send({
    From: "TestOwner",
    Action: "VerseEntityUpdatePosition",
    Data: JSON.stringify({
      Position: [3, 4],
    }),
    Timestamp: 10006,
  })

  assert.equal(result.Output.data, "VerseEntityUpdatePosition")

  const result2 = await Send({
    Action: "Eval",
    Data: `require('json').encode(VerseDbAdmin:exec('SELECT * FROM Entities')[1])`,
  })

  assert.deepEqual(JSON.parse(result2.Output.data.output), { Id: 'TestOwner', LastUpdated: 10006, Type: 'Avatar', Position: '[3,4]' })
});

test('check VerseEntitiesDynamic handler', async () => {
  const result = await Send({
    From: "TestOwner",
    Action: "VerseEntitiesDynamic",
    Data: JSON.stringify({ Timestamp: 0 })
  })

  assert.equal(result.Output.data, "VerseEntitiesDynamic")
  assert.deepEqual(JSON.parse(result.Messages[0].Data), { TestOwner: { Type: 'Avatar', Position: [3, 4] } })
})

test('check VerseEntitiesDynamic handler future timestamp', async () => {
  const result = await Send({
    From: "TestOwner",
    Action: "VerseEntitiesDynamic",
    Data: JSON.stringify({ Timestamp: 99999 })
  })

  assert.equal(result.Output.data, "VerseEntitiesDynamic")
  assert.deepEqual(JSON.parse(result.Messages[0].Data), [])
})
