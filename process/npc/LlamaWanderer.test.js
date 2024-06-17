import { test } from 'node:test'
import * as assert from 'node:assert'
import { Send } from '../aos.helper.js'
import fs from 'node:fs'

const LlamaLand = "9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss"

test('load source', async () => {
  const code = fs.readFileSync('./npc/LlamaWanderer.lua', 'utf-8')
  const result = await Send({ Action: "Eval", Data: code })

  assert.equal(result.Output.data.output, undefined)
})
