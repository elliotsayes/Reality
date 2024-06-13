import { test } from 'node:test'
import * as assert from 'node:assert'
import { Send } from '../aos.helper.js'
import fs from 'node:fs'

const LlmWokerId = "4zQMuZlze_PoKcffdLTkXLv90_DusEENofq3Bg-hHQk"

test('load source', async () => {
  const code = fs.readFileSync('./npc/LlamaKing.lua', 'utf-8')
  const result = await Send({ Action: "Eval", Data: code })

  assert.equal(result.Output.data.output, undefined)
})

test('Petition Handler no Original-Message', async () => {
  const result = await Send({
    From: "TODO: BankerProcessId",
    Action: "Petition",
    // ["Original-Message"]: "MyCreditNoticeMessageId",
  })

  assert.equal(result.Output.data, "No original message id found")
})

test('Petition Handler with Original-Message', async () => {
  const plea = "My Plea to the king"
  const result = await Send({
    From: "TODO: BankerProcessId",
    Action: "Petition",
    ["Original-Message"]: "MyCreditNoticeMessageId",
    Data: plea,
  })

  const message = result.Messages[0]
  assert.equal(message.Target, LlmWokerId)
  // assert.equal(message.Tags.Action, 'Petition')
  assert.equal(message.Data, plea)
})

test('Petition Handler with duplicate Original-Message', async () => {
  const result = await Send({
    From: "TODO: BankerProcessId",
    Action: "Petition",
    ["Original-Message"]: "MyCreditNoticeMessageId",
  })

  assert.equal(result.Output.data, "Message already exists")
})
test('Inference Response Handler Unknow Sender', async () => {
  const result = await Send({
    From: "Some hacker",
    Action: "Inference-Response",
    ["Original-Message"]: "MyCreditNoticeMessageId",
    "Grade": "1"
  })

  assert.equal(result.Output.data, "Not a Llama Worker")
})

test('Inference Response Handler Unknown message', async () => {
  const result = await Send({
    From: LlmWokerId,
    Action: "Inference-Response",
    ["Original-Message"]: "FAKECreditNoticeMessageId",
    "Grade": "1"
  })

  assert.equal(result.Output.data, "Message not found")
})

test('Inference Response Handler', async () => {
  const result = await Send({
    From: LlmWokerId,
    Action: "Inference-Response",
    ["Original-Message"]: "MyCreditNoticeMessageId",
    ["Original-Sender"]: "SOME SENDER",
    "Grade": "1"
  })

  const message = result.Messages[0]
  assert.equal(message.Target, "TODO: BankerProcessId")
})


