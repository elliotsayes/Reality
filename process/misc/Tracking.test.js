import { test } from "node:test";
import * as assert from "node:assert";
import { Send } from "../aos.helper.js";
import fs from "node:fs";

const TWENTYTWO_HOURS_HALF_MS = 22.5 * 60 * 60 * 1000;
const TWENTYTHREE_HOURS_HALF_MS = 23.5 * 60 * 60 * 1000;
const LLAMA_TOKEN_PORECESS_ID = "TODO: LlamaTokenProcessId";

test("load DbAdmin module", async () => {
  const dbAdminCode = fs.readFileSync("./misc/DbAdmin.lua", "utf-8");
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
  const code = fs.readFileSync("./misc/Tracking.lua", "utf-8");
  const result = await Send({ Action: "Eval", Data: code });

  assert.equal(result.Output.data.output, "Loaded Tracking");
});

const intialTimestamp = new Date().getTime().toString();
const tooEarlyTimestamp = (
  new Date().getTime() + TWENTYTWO_HOURS_HALF_MS
).toString();
const afterThresholdTimestamp = (
  new Date().getTime() + TWENTYTHREE_HOURS_HALF_MS
).toString();

test("Tracking-Login initial, first time reward", async () => {
  const result = await Send({
    Action: "Tracking-Login",
    Timestamp: intialTimestamp,
  });

  const reply = result.Messages[0];
  const actionValue = reply.Tags.find((tag) => tag.name === "Action").value;
  assert.equal(actionValue, "Login-Reward");
  const messageValue = reply.Tags.find((tag) => tag.name === "Message").value;
  assert.equal(
    messageValue,
    "Congratulations! Enjoy this reward for your first time logging in!",
  );
  const quantityValue = reply.Tags.find((tag) => tag.name === "Quantity").value;
  assert.equal(quantityValue, "5000000000000");

  const transfer = result.Messages[1];
  assert.equal(transfer.Target, LLAMA_TOKEN_PORECESS_ID);
  const actionValue2 = transfer.Tags.find((tag) => tag.name === "Action").value;
  assert.equal(actionValue2, "Grant");
  const quantityValue2 = transfer.Tags.find(
    (tag) => tag.name === "Quantity",
  ).value;
  assert.equal(quantityValue2, "5000000000000");
});

test("Tracking-Login too early, no reward", async () => {
  const result = await Send({
    Action: "Tracking-Login",
    Timestamp: tooEarlyTimestamp,
  });

  assert.equal(result.Messages.length, 1);
  const reply = result.Messages[0];

  const actionValue = reply.Tags.find((tag) => tag.name === "Action").value;
  assert.equal(actionValue, "Login-Info");
  const messageValue = reply.Tags.find((tag) => tag.name === "Message").value;
  assert.equal(messageValue, "No Reward");
  const quantityTag = reply.Tags.find((tag) => tag.name === "Quantity");
  assert.equal(quantityTag, undefined);
});

test("Tracking-Login after threshold, daily reward", async () => {
  const result = await Send({
    Action: "Tracking-Login",
    Timestamp: afterThresholdTimestamp,
  });

  const reply = result.Messages[0];
  const actionValue = reply.Tags.find((tag) => tag.name === "Action").value;
  assert.equal(actionValue, "Login-Reward");
  const messageValue = reply.Tags.find((tag) => tag.name === "Message").value;
  assert.equal(messageValue, "Enjoy this reward for logging in again today!");
  const quantityValue = reply.Tags.find((tag) => tag.name === "Quantity").value;
  assert.ok(parseInt(quantityValue) > 0);

  const transfer = result.Messages[1];
  assert.equal(transfer.Target, LLAMA_TOKEN_PORECESS_ID);
  const actionValue2 = transfer.Tags.find((tag) => tag.name === "Action").value;
  assert.equal(actionValue2, "Grant");
  const quantityValue2 = transfer.Tags.find(
    (tag) => tag.name === "Quantity",
  ).value;
  assert.equal(quantityValue2, quantityValue);
});
