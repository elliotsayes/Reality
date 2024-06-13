import AoLoader from '@permaweb/ao-loader'
import fs from 'fs'
import process from 'process'

const aos = fs.readFileSync(process.env.WASM || './module/AOS.wasm')
const format = process.env.FORMAT || 'wasm32-unknown-emscripten'
let memory = null

export async function Send(DataItem) {

  const msg = Object.keys(DataItem).reduce(function (di, k) {
    if (di[k]) {
      di[k] = DataItem[k]
    } else {
      di.Tags = di.Tags.concat([{ name: k, value: DataItem[k] }])
    }
    return di
  }, createMsg())

  const handle = await AoLoader(aos, { format })
  const env = createEnv()

  const result = await handle(memory, msg, env)
  if (result.Error) {
    return 'ERROR: ' + JSON.stringify(result.Error)
  }
  memory = result.Memory

  return { Messages: result.Messages, Spawns: result.Spawns, Output: result.Output, Assignments: result.Assignments }
}

function createMsg() {
  return {
    Id: '1234',
    Target: 'AOS',
    Owner: 'OWNER',
    From: 'OWNER',
    Data: '1984',
    Tags: [],
    'Block-Height': '1',
    Timestamp: Date.now(),
    Module: '4567'
  }
}

function createEnv() {
  return {
    Process: {
      Id: '9876',
      Tags: [
        { name: 'Data-Protocol', value: 'ao' },
        { name: 'Variant', value: 'ao.TN.1' },
        { name: 'Type', value: 'Process' }
      ]
    },
    Module: {
      Id: '4567',
      Tags: [
        { name: 'Data-Protocol', value: 'ao' },
        { name: 'Variant', value: 'ao.TN.1' },
        { name: 'Type', value: 'Module' }
      ]
    }
  }
}