import { test } from "node:test";
import * as assert from "node:assert";
import { Send } from "../aos.helper.js";
import fs from "node:fs";

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

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
  const code = fs.readFileSync("./misc/Waitlist.lua", "utf-8");
  const result = await Send({ Action: "Eval", Data: code });

  assert.equal(result.Output.data.output, "Loaded Waitlist Protocol");
});

test("load tracking", async () => {
  const code = fs.readFileSync("./misc/Tracking.lua", "utf-8");
  const result = await Send({ Action: "Eval", Data: code });

  assert.equal(result.Output.data.output, "Loaded Tracking");
});

test("WaitlistState empty waitlist", async () => {
  const result = await Send({
    Read: "Waitlist-State",
  });

  assert.ok(result);
});

test("WaitlistPage empty waitlist", async () => {
  const result = await Send({
    Read: "Waitlist-Page",
  });

  const reply = result.Messages[0];

  const page = JSON.parse(reply.Data)["Page"];
  assert.equal(page.length, 0);
});

test("WaitlistBump with empty waitlist", async () => {
  const result = await Send({
    Action: "Waitlist-Bump",
  });

  assert.equal(result.Messages.length, 0);
  assert.ok(result.Output.data.endsWith("User not found in waitlist"));
});

test("WaitlistAdd success", async () => {
  const result = await Send({
    Action: "Waitlist-Register",
  });

  const reply = result.Messages[0];
  const replyData = JSON.parse(reply.Data);
  assert.deepEqual(replyData, {
    TimestampCreated: 10003,
    TimestampLastBumped: 0,
    WalletId: "OWNER",
    BumpCount: 0,
  });

  const dbResult = await Send({
    Action: "Eval",
    Data: "require('json').encode(WaitlistDbAdmin:exec('SELECT * FROM Waitlist'))",
  });
  const dbOutput = JSON.parse(dbResult.Output.data.output);
  assert.deepEqual(dbOutput, [
    {
      TimestampCreated: 10003,
      WalletId: "OWNER",
      Id: 1,
      TimestampLastBumped: 0,
      BumpCount: 0,
    },
  ]);
});

test("WaitlistAdd retry reject", async () => {
  const result = await Send({
    Action: "Waitlist-Register",
    Timestamp: 10004,
  });

  assert.equal(result.Messages.length, 0);
  assert.ok(result.Output.data.endsWith("User already in waitlist"));

  // Db should be the same
  const dbResult = await Send({
    Action: "Eval",
    Data: "require('json').encode(WaitlistDbAdmin:exec('SELECT * FROM Waitlist'))",
  });
  const dbOutput = JSON.parse(dbResult.Output.data.output);
  assert.deepEqual(dbOutput, [
    {
      TimestampCreated: 10003,
      WalletId: "OWNER",
      Id: 1,
      TimestampLastBumped: 0,
      BumpCount: 0,
    },
  ]);
});

test("WaitlistBump first is free", async () => {
  const earlyTs = 10005 + TWELVE_HOURS_MS - 200;
  const result = await Send({
    Action: "Waitlist-Bump",
    Timestamp: earlyTs,
  });

  const reply = result.Messages[0];
  const replyData = JSON.parse(reply.Data);
  assert.deepEqual(replyData, {
    TimestampCreated: 10003,
    TimestampLastBumped: earlyTs,
    WalletId: "OWNER",
    BumpCount: 1,
  });

  // Db should be the same
  const dbResult = await Send({
    Action: "Eval",
    Data: "require('json').encode(WaitlistDbAdmin:exec('SELECT * FROM Waitlist'))",
  });
  const dbOutput = JSON.parse(dbResult.Output.data.output);
  assert.deepEqual(dbOutput, [
    {
      TimestampCreated: 10003,
      WalletId: "OWNER",
      Id: 1,
      TimestampLastBumped: earlyTs,
      BumpCount: 1,
    },
  ]);
});

test("WaitlistBump too soon fails", async () => {
  const result = await Send({
    Action: "Waitlist-Bump",
    Timestamp: 10005 + TWELVE_HOURS_MS - 100,
  });

  assert.equal(result.Messages.length, 0);
  assert.ok(result.Output.data.endsWith("User cannot bump yet"));

  // Db should be the same
  const dbResult = await Send({
    Action: "Eval",
    Data: "require('json').encode(WaitlistDbAdmin:exec('SELECT * FROM Waitlist'))",
  });
  const dbOutput = JSON.parse(dbResult.Output.data.output);
  assert.deepEqual(dbOutput, [
    {
      TimestampCreated: 10003,
      WalletId: "OWNER",
      Id: 1,
      TimestampLastBumped: 43209805,
      BumpCount: 1,
    },
  ]);
});

test("WaitlistBump in ages success", async () => {
  const agesTs = 10005 + TWELVE_HOURS_MS * 2 + 100;
  const result = await Send({
    Action: "Waitlist-Bump",
    Timestamp: agesTs,
  });

  const reply = result.Messages[0];
  const replyData = JSON.parse(reply.Data);
  assert.deepEqual(replyData, {
    WalletId: "OWNER",
    TimestampCreated: 10003,
    TimestampLastBumped: agesTs,
    BumpCount: 2,
  });
});

test("WaitlistBump just after fails", async () => {
  const agesPlusTs = 10005 + TWELVE_HOURS_MS + 100 + 100;
  const result = await Send({
    Action: "Waitlist-Bump",
    Timestamp: agesPlusTs,
  });

  assert.equal(result.Messages.length, 0);
  assert.ok(result.Output.data.endsWith("User cannot bump yet"));
});

test("WaitlistAdd another success", async () => {
  const result = await Send({
    From: "ANOTHER",
    Action: "Waitlist-Register",
    Timestamp: 10006,
  });

  const reply = result.Messages[0];
  const replyData = JSON.parse(reply.Data);
  assert.deepEqual(replyData, {
    TimestampCreated: 10006,
    TimestampLastBumped: 0,
    WalletId: "ANOTHER",
    BumpCount: 0,
  });

  const dbResult = await Send({
    Action: "Eval",
    Data: "require('json').encode(WaitlistDbAdmin:exec('SELECT * FROM Waitlist'))",
  });
  const dbOutput = JSON.parse(dbResult.Output.data.output);
  assert.deepEqual(dbOutput, [
    {
      TimestampCreated: 10003,
      WalletId: "OWNER",
      Id: 1,
      TimestampLastBumped: 86410105,
      BumpCount: 2,
    },
    {
      TimestampCreated: 10006,
      WalletId: "ANOTHER",
      Id: 2,
      TimestampLastBumped: 0,
      BumpCount: 0,
    },
  ]);
});

test("Range", async () => {
  const result = await Send({
    Action: "Eval",
    Data: "require('json').encode(Range(10, 5, -1))",
  });

  assert.deepEqual(JSON.parse(result.Output.data.output), [10, 9, 8, 7, 6, 5]);
});

test("WaitlistState main user", async () => {
  const result = await Send({
    Read: "Waitlist-State",
  });
  // console.log(result)

  const reply = result.Messages[0];
  const replyData = JSON.parse(reply.Data);
  // console.log(replyData)
  assert.equal(replyData.RankDesc.length, 2);
  assert.equal(replyData.Count, 2);
  assert.equal(replyData.UserPosition, 1);
});

test("WaitlistState second user", async () => {
  const result = await Send({
    From: "ANOTHER",
    Read: "Waitlist-State",
  });
  // console.log(result)

  const reply = result.Messages[0];
  const replyData = JSON.parse(reply.Data);
  // console.log(replyData)
  assert.equal(replyData.RankDesc.length, 2);
  assert.equal(replyData.Count, 2);
  assert.equal(replyData.UserPosition, 2);
});

test("WaitlistState Unknown user", async () => {
  const result = await Send({
    From: "Who?",
    Read: "Waitlist-State",
  });
  // console.log(result)

  const reply = result.Messages[0];
  const replyData = JSON.parse(reply.Data);
  // console.log(replyData)
  assert.equal(replyData.RankDesc.length, 2);
  assert.equal(replyData.Count, 2);
  assert.equal(replyData.UserPosition, 0);
});

test("Run migration", async () => {
  const code = fs.readFileSync("./misc/WaitlistMigration1.lua", "utf-8");
  const result = await Send({ Action: "Eval", Data: code });

  assert.equal(result.Output.data.output, "Loaded Migration1 Script");

  await Send({
    Action: "Eval",
    Data: "WaitlistDbMigration1()",
  });

  const dbResult = await Send({
    Action: "Eval",
    Data: "require('json').encode(WaitlistDbAdmin:exec('SELECT * FROM Waitlist'))",
  });
  assert.deepEqual(JSON.parse(dbResult.Output.data.output), [
    {
      TimestampCreated: 10003,
      Authorised: 0,
      WalletId: "OWNER",
      Flagged: 0,
      Id: 1,
      Claimed: 0,
      TimestampLastBumped: 86410105,
      BumpCount: 2,
    },
    {
      TimestampCreated: 10006,
      Authorised: 0,
      WalletId: "ANOTHER",
      Flagged: 0,
      Id: 2,
      Claimed: 0,
      TimestampLastBumped: 0,
      BumpCount: 0,
    },
  ]);
});

const intialTimestamp = new Date().getTime().toString();
const tooEarlyTimestamp = (
  new Date().getTime() + TWENTYTWO_HOURS_HALF_MS
).toString();
const afterThresholdTimestamp = (
  new Date().getTime() + TWENTYTHREE_HOURS_HALF_MS
).toString();

test("Tracking-Login not authorised, failed", async () => {
  const result = await Send({
    Action: "Tracking-Login",
    Timestamp: intialTimestamp,
  });

  const reply = result.Messages[0];
  const actionValue = reply.Tags.find((tag) => tag.name === "Action").value;
  assert.equal(actionValue, "Login-Failed");
  const messageValue = reply.Tags.find((tag) => tag.name === "Message").value;
  assert.equal(messageValue, "You are not high enough on the waitlist yet!");
});

test("Tracking-Login when authorised, first time reward", async () => {
  await Send({
    Action: "Eval",
    Data: "require('json').encode(WaitlistDbAdmin:exec('UPDATE Waitlist SET Authorised = 1 WHERE WalletId = \"OWNER\"'))",
  });

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
  assert.equal(quantityValue, "1000000000000");

  const transfer = result.Messages[1];
  assert.equal(transfer.Target, LLAMA_TOKEN_PORECESS_ID);
  const actionValue2 = transfer.Tags.find((tag) => tag.name === "Action").value;
  assert.equal(actionValue2, "Grant");
  const quantityValue2 = transfer.Tags.find(
    (tag) => tag.name === "Quantity",
  ).value;
  assert.equal(quantityValue2, "1000000000000");
});

test("Tracking-Login too soon, no reward", async () => {
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
