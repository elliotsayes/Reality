import { test } from "node:test";
import * as assert from "node:assert";
import { Send } from "../aos.helper.js";
import fs from "node:fs";

test("load DbAdmin module", async () => {
  const dbAdminCode = fs.readFileSync("./blueprint/DbAdmin.lua", "utf-8");
  const result = await Send({
    Action: "Eval",
    Data: `
local function _load()
  ${dbAdminCode}
end
_G.package.loaded["DbAdmin"] = _load()
return "ok"`,
  });
  assert.equal(result.Output.data.output, "ok");
});

test("load source", async () => {
  const code = fs.readFileSync("./blueprint/Reality.lua", "utf-8");
  const result = await Send({ Action: "Eval", Data: code });

  assert.equal(result.Output.data.output, "Loaded Reality Protocol");
});

test("load llama land", async () => {
  const code = fs.readFileSync("./world/3_LlamaLand.lua", "utf-8");
  const result = await Send({ Action: "Eval", Data: code });

  assert.equal(result.Output.data.output, undefined);
});

test("check table exists", async () => {
  const result = await Send({
    Action: "Eval",
    Data: `require('json').encode(RealityDbAdmin:tables())`,
  });

  assert.deepEqual(JSON.parse(result.Output.data.output), ["Entities"]);
});

test("check Entities table empty", async () => {
  const result = await Send({
    Action: "Eval",
    Data: `RealityDbAdmin:count('Entities')`,
  });

  assert.deepEqual(result.Output.data.output, "0");
});

test("check RealityEntityCreate handler", async () => {
  const result = await Send({
    From: "TestOwner",
    Action: "Reality.EntityCreate",
    Data: JSON.stringify({
      Type: "Avatar",
      Position: [1, 2],
    }),
  });

  assert.equal(result.Output.data, "Reality.EntityCreate");

  const result2 = await Send({
    Action: "Eval",
    Data: `require('json').encode(RealityDbAdmin:exec('SELECT * FROM Entities')[1])`,
  });

  assert.deepEqual(JSON.parse(result2.Output.data.output), {
    Id: "TestOwner",
    LastUpdated: 10003,
    Type: "Avatar",
    Position: "[1,2]",
    Metadata: '{"_":false}',
  });
});

test("check RealityEntityUpdatePosition handler", async () => {
  const result = await Send({
    From: "TestOwner",
    Action: "Reality.EntityUpdatePosition",
    Data: JSON.stringify({
      Position: [3, 4],
    }),
    Timestamp: 10006,
  });

  assert.equal(result.Output.data, "Reality.EntityUpdatePosition");

  const result2 = await Send({
    Action: "Eval",
    Data: `require('json').encode(RealityDbAdmin:exec('SELECT * FROM Entities')[1])`,
  });

  assert.deepEqual(JSON.parse(result2.Output.data.output), {
    Id: "TestOwner",
    LastUpdated: 10006,
    Type: "Avatar",
    Position: "[3,4]",
    Metadata: '{"_":false}',
  });
});

test("check RealityEntitiesDynamic handler", async () => {
  const result = await Send({
    From: "TestOwner",
    Action: "Reality.EntitiesDynamic",
    Data: JSON.stringify({ Timestamp: 0 }),
  });

  assert.equal(result.Output.data, "Reality.EntitiesDynamic");
  assert.deepEqual(JSON.parse(result.Messages[0].Data), {
    TestOwner: { Type: "Avatar", Position: [3, 4], Metadata: { _: false } },
  });
});

test("check RealityEntitiesDynamic handler future timestamp", async () => {
  const result = await Send({
    From: "TestOwner",
    Action: "Reality.EntitiesDynamic",
    Data: JSON.stringify({ Timestamp: 99999 }),
  });

  assert.equal(result.Output.data, "Reality.EntitiesDynamic");
  assert.deepEqual(JSON.parse(result.Messages[0].Data), []);
});
