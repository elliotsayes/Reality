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
  const code = fs.readFileSync('./blueprint/Chat.lua', 'utf-8')
  const result = await Send({ Action: "Eval", Data: code })

  assert.equal(result.Output.data.output, "Loaded Chat Protocol")
})
