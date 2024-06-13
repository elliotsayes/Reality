import { test } from 'node:test'
import * as assert from 'node:assert'
import { Send } from '../aos.helper.js'
import fs from 'node:fs'

test('load source', async () => {
  const code = fs.readFileSync('./blueprint/Verse.lua', 'utf-8')
  const result = await Send({ Action: "Eval", Data: code })

  assert.equal(result.Output.data.output, "Loaded Verse Protocol")
})
