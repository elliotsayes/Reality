import { test } from 'node:test'
import * as assert from 'node:assert'
import { Send } from '../aos.helper.js'
import fs from 'node:fs'

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000

test('load DbAdmin module', async () => {
  const dbAdminCode = fs. readFileSync('./misc/DbAdmin.lua', 'utf-8')
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
  const code = fs.readFileSync('./misc/Waitlist.lua', 'utf-8')
  const result = await Send({ Action: "Eval", Data: code })

  assert.equal(result.Output.data.output, "Loaded Waitlist Protocol")
})

test('WaitlistState empty waitlist', async () => {
  const result = await Send({
    Read: "Waitlist-State",
  })

  assert.ok(result)
});

test('WaitlistPage empty waitlist', async () => {
  const result = await Send({
    Read: "Waitlist-Page",
  })

  const reply = result.Messages[0]

  const page = JSON.parse(reply.Data)['Page']
  assert.equal(page.length, 0)
});

test('WaitlistBump with empty waitlist', async () => {
  const result = await Send({
    Action: "Waitlist-Bump",
  });

  assert.equal(result.Messages.length, 0)
  assert.ok(result.Output.data.endsWith("User not found in waitlist"))
});

test('WaitlistAdd success', async () => {
  const result = await Send({
    Action: "Waitlist-Register",
  });

  const reply = result.Messages[0]
  const replyData = JSON.parse(reply.Data)
  assert.deepEqual(replyData, {"TimestampCreated":10003,"TimestampLastBumped":10003,"WalletId":"OWNER","BumpCount":0})

  const dbResult = await Send({
    Action: 'Eval',
    Data: "require('json').encode(WaitlistDbAdmin:exec('SELECT * FROM Waitlist'))"
  })
  const dbOutput = JSON.parse(dbResult.Output.data.output)
  assert.deepEqual(dbOutput, [
    {
      TimestampCreated: 10003,
      WalletId: 'OWNER',
      Id: 1,
      TimestampLastBumped: 10003,
      BumpCount: 0
    }
  ])
})

test('WaitlistAdd retry reject', async () => {
  const result = await Send({
    Action: "Waitlist-Register",
    Timestamp: 10004,
  });

  assert.equal(result.Messages.length, 0)
  assert.ok(result.Output.data.endsWith("User already in waitlist"))

  // Db should be the same
  const dbResult = await Send({
    Action: 'Eval',
    Data: "require('json').encode(WaitlistDbAdmin:exec('SELECT * FROM Waitlist'))"
  })
  const dbOutput = JSON.parse(dbResult.Output.data.output)
  assert.deepEqual(dbOutput, [
    {
      TimestampCreated: 10003,
      WalletId: 'OWNER',
      Id: 1,
      TimestampLastBumped: 10003,
      BumpCount: 0
    }
  ])
})

test('WaitlistBump too soon fails', async () => {
  const result = await Send({
    Action: "Waitlist-Bump",
    Timestamp: 10005 + TWELVE_HOURS_MS - 100,
  });

  assert.equal(result.Messages.length, 0)
  assert.ok(result.Output.data.endsWith("User cannot bump yet"))

  // Db should be the same
  const dbResult = await Send({
    Action: 'Eval',
    Data: "require('json').encode(WaitlistDbAdmin:exec('SELECT * FROM Waitlist'))"
  })
  const dbOutput = JSON.parse(dbResult.Output.data.output)
  assert.deepEqual(dbOutput, [
    {
      TimestampCreated: 10003,
      WalletId: 'OWNER',
      Id: 1,
      TimestampLastBumped: 10003,
      BumpCount: 0
    }
  ])
});

test('WaitlistBump in ages success', async () => {
  const agesTs = 10005 + TWELVE_HOURS_MS + 100
  const result = await Send({
    Action: "Waitlist-Bump",
    Timestamp: agesTs,
  });

  const reply = result.Messages[0]
  const replyData = JSON.parse(reply.Data)
  assert.deepEqual(replyData, {
    "WalletId": "OWNER",
    "TimestampCreated": 10003,
    "TimestampLastBumped": agesTs,
    "BumpCount": 1,
  })
});

test('WaitlistBump just after fails', async () => {
  const agesPlusTs = 10005 + TWELVE_HOURS_MS + 100 + 100
  const result = await Send({
    Action: "Waitlist-Bump",
    Timestamp: agesPlusTs,
  });

  assert.equal(result.Messages.length, 0)
  assert.ok(result.Output.data.endsWith("User cannot bump yet"))
});

test('WaitlistAdd another success', async () => {
  const result = await Send({
    From: "ANOTHER",
    Action: "Waitlist-Register",
    Timestamp: 10006,
  });

  const reply = result.Messages[0]
  const replyData = JSON.parse(reply.Data)
  assert.deepEqual(replyData, {"TimestampCreated":10006,"TimestampLastBumped":10006,"WalletId":"ANOTHER","BumpCount":0})

  const dbResult = await Send({
    Action: 'Eval',
    Data: "require('json').encode(WaitlistDbAdmin:exec('SELECT * FROM Waitlist'))"
  })
  const dbOutput = JSON.parse(dbResult.Output.data.output)
  assert.deepEqual(dbOutput, [
    {
      TimestampCreated: 10003,
      WalletId: 'OWNER',
      Id: 1,
      TimestampLastBumped: 43210105,
      BumpCount: 1
    },
    {
      TimestampCreated: 10006,
      WalletId: 'ANOTHER',
      Id: 2,
      TimestampLastBumped: 10006,
      BumpCount: 0
    }
  ])
})

test('Range', async () => {
  const result = await Send({
    Action: "Eval",
    Data: "require('json').encode(Range(10, 5, -1))"
  })

  assert.deepEqual(JSON.parse(result.Output.data.output), [
    10,
    9,
    8,
    7,
    6,
    5
  ])
});

test('WaitlistState main user', async () => {
  const result = await Send({
    Read: "Waitlist-State",
  })
  // console.log(result)

  const reply = result.Messages[0]
  const replyData = JSON.parse(reply.Data)
  // console.log(replyData)
  assert.equal(replyData.RankDesc.length, 2)
  assert.equal(replyData.Count, 2);
  assert.equal(replyData.UserPosition, 1)
});


test('WaitlistState second user', async () => {
  const result = await Send({
    From: "ANOTHER",
    Read: "Waitlist-State",
  })
  // console.log(result)

  const reply = result.Messages[0]
  const replyData = JSON.parse(reply.Data)
  // console.log(replyData)
  assert.equal(replyData.RankDesc.length, 2)
  assert.equal(replyData.Count, 2);
  assert.equal(replyData.UserPosition, 2)
});

test('WaitlistState Unknown user', async () => {
  const result = await Send({
    From: "Who?",
    Read: "Waitlist-State",
  })
  // console.log(result)

  const reply = result.Messages[0]
  const replyData = JSON.parse(reply.Data)
  console.log(replyData)
  assert.equal(replyData.RankDesc.length, 2)
  assert.equal(replyData.Count, 2);
  assert.equal(replyData.UserPosition, 0)
});
