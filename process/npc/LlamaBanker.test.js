import { test } from 'node:test'
import * as assert from 'node:assert'
import { Send } from '../aos.helper.js'
import fs from 'node:fs'

const WarToken = "TODO: WarProcessId"
const LlamaToken = "TODO: LlamaTokenProcessId"
const LlamaKing = "TODO: LlamaKingProcessId"

const exampleSender = "SOME RANDOM GUY"

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
  const code = fs.readFileSync('./npc/LlamaBanker.lua', 'utf-8')
  const result = await Send({ Action: "Eval", Data: code })

  assert.equal(result.Output.data.output, undefined)
})

test('Credits from wrong source', async () => {
  const result = await Send({
    From: "Some hacker token",
    Action: "Credit-Notice",
    Amount: 100,
  })

  assert.equal(result.Output.data, "Credit Notice not from $wAR")
})

test('Credits from wAR', async () => {
  const plea = "My Plea to the king"
  const result = await Send({
    Id: 'MyMessageId',
    From: WarToken,
    Action: "Credit-Notice",
    Quantity: 100,
    ['X-Petition']: plea,
    Sender: exampleSender
  })

  const message = result.Messages[0]
  assert.equal(message.Target, LlamaKing)
  assert.equal(message.Data, plea)
})

test('Saved History', async () => {
  const result = await Send({
    Action: "Eval",
    Data: `require('json').encode(BankerDbAdmin:exec('SELECT * FROM WarCredit')[1])`
  })

  assert.deepEqual(JSON.parse(result.Output.data.output), {
    MessageId: 'MyMessageId',
    Quantity: 100,
    Sender: 'SOME RANDOM GUY'
  })
});


test('GradePetitionHandler not from King', async () => {
  const result = await Send({
    From: "Not the King",
    Action: "Grade-Petition",
    ['Original-Message']: "MyMessageId",
    Grade: "5",
  })

  assert.equal(result.Output.data, "Petition not from LlamaKing")
})

test('GradePetitionHandler unknown msg Id', async () => {
  const result = await Send({
    From: LlamaKing,
    Action: "Grade-Petition",
    ['Original-Message']: "Some unknown message id",
    Grade: "5",
  })

  assert.equal(result.Output.data, "Credit not found")
})

test('GradePetitionHandler happy', async () => {
  for (let i = 0; i < 100000; i++) {
    const result = await Send({
      From: LlamaKing,
      Action: "Grade-Petition",
      ['Original-Message']: "MyMessageId",
      ['Original-Sender']: exampleSender,
      Grade: `10`,
      Timestamp: 10000000 + i * 10
    })

    const message = result.Messages[0]
    assert.equal(message.Target, LlamaToken)
    const quantity = message.Tags.filter(t => t.name === "Quantity")[0].value
    console.log(i, "emit:", quantity)

    const emissionsTotalResult = await Send({
      Action: "Eval",
      Data: `require('json').encode(BankerDbAdmin:exec('SELECT SUM(Amount) as Value FROM Emissions')[1].Value)`
    })
    console.log(i, "total:", emissionsTotalResult.Output.data.output)
  }
})