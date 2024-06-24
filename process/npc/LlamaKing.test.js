import { test } from "node:test";
import * as assert from "node:assert";
import { Send } from "../aos.helper.js";
import fs from "node:fs";

const LlmWorkerId1 = "4zQMuZlze_PoKcffdLTkXLv90_DusEENofq3Bg-hHQk";
const LlmWorkerId2 = "FAKEWORKER2";

test("load source", async () => {
  const code = fs.readFileSync("./npc/LlamaKing.lua", "utf-8");
  const result = await Send({ Action: "Eval", Data: code });

  assert.equal(result.Output.data.output, undefined);
});

test("Petition Handler no Original-Message", async () => {
  const result = await Send({
    From: "TODO: BankerProcessId",
    Action: "Petition",
    // ["Original-Message"]: "MyCreditNoticeMessageId",
    ["Original-Sender"]: "SOME SENDER",
    ["Original-Sender-Name"]: "SOME SENDER NAME",
  });

  assert.equal(result.Output.data, "No original message id found");
});

test("Petition Handler with Original-Message", async () => {
  const plea = "My Plea to the king";
  const result = await Send({
    From: "TODO: BankerProcessId",
    Action: "Petition",
    ["Original-Message"]: "MyCreditNoticeMessageId",
    ["Original-Sender"]: "SOME SENDER",
    ["Original-Sender-Name"]: "SOME SENDER NAME",
    Data: plea,
  });

  const message = result.Messages[0];
  assert.equal(message.Target, LlmWorkerId1);
  // assert.equal(message.Tags.Action, 'Petition')
  assert.equal(message.Data, plea);
});

test("Petition Handler with different Original-Message", async () => {
  const plea = "My Other plea to the king";
  const result = await Send({
    From: "TODO: BankerProcessId",
    Action: "Petition",
    ["Original-Message"]: "MyCreditNoticeMessageId2",
    ["Original-Sender"]: "SOME SENDER",
    ["Original-Sender-Name"]: "SOME SENDER NAME",
    Data: plea,
  });

  const message = result.Messages[0];
  assert.equal(message.Target, LlmWorkerId2);
  // assert.equal(message.Tags.Action, 'Petition')
  assert.equal(message.Data, plea);
});

test("Petition Handler with duplicate Original-Message", async () => {
  const result = await Send({
    From: "TODO: BankerProcessId",
    Action: "Petition",
    ["Original-Message"]: "MyCreditNoticeMessageId",
    ["Original-Sender"]: "SOME SENDER",
    ["Original-Sender-Name"]: "SOME SENDER NAME",
  });

  assert.equal(result.Output.data, "Message already exists");
});

test("Inference Response Handler Unknow Sender", async () => {
  const result = await Send({
    From: "Some hacker",
    Action: "Inference-Response",
    ["Original-Message"]: "MyCreditNoticeMessageId",
    Grade: "1",
  });

  assert.equal(result.Output.data, "Not a Llama Worker");
});

test("Inference Response Handler Unknown message", async () => {
  const result = await Send({
    From: LlmWorkerId1,
    Action: "Inference-Response",
    ["Original-Message"]: "FAKECreditNoticeMessageId",
    Grade: "1",
  });

  assert.equal(result.Output.data, "Message not found");
});

test("Inference Response Handler", async () => {
  const result = await Send({
    From: LlmWorkerId1,
    Action: "Inference-Response",
    ["Original-Message"]: "MyCreditNoticeMessageId",
    ["Original-Sender"]: "SOME SENDER",
    Grade: "1",
    Data: "My response",
  });

  const message = result.Messages[0];
  assert.equal(message.Target, "TODO: BankerProcessId");
});

test("Inference Response Handler Duplicate", async () => {
  const result = await Send({
    From: LlmWorkerId1,
    Action: "Inference-Response",
    ["Original-Message"]: "MyCreditNoticeMessageId",
    ["Original-Sender"]: "SOME SENDER",
    Grade: "1",
    Data: "My response",
  });

  assert.equal(result.Output.data, "Message not found");
});

test("LLM_WORKERS State", async () => {
  const result = await Send({
    Action: "Eval",
    Data: `require('json').encode(LLM_WORKERS)`,
  });

  assert.deepEqual(JSON.parse(result.Output.data.output), {
    "4zQMuZlze_PoKcffdLTkXLv90_DusEENofq3Bg-hHQk": [],
    FAKEWORKER2: {
      busyWithMessage: "MyCreditNoticeMessageId2",
      submittedTimestamp: 10003,
    },
  });
});

test("Inference Response Handler Second", async () => {
  const result = await Send({
    From: LlmWorkerId1,
    Action: "Inference-Response",
    ["Original-Message"]: "MyCreditNoticeMessageId2",
    ["Original-Sender"]: "SOME SENDER",
    Grade: "10",
  });

  const message = result.Messages[0];
  assert.equal(message.Target, "TODO: BankerProcessId");
});

test("LLM_WORKERS Final", async () => {
  const result = await Send({
    Action: "Eval",
    Data: `require('json').encode(LLM_WORKERS)`,
  });

  assert.deepEqual(JSON.parse(result.Output.data.output), {
    FAKEWORKER2: [],
    "4zQMuZlze_PoKcffdLTkXLv90_DusEENofq3Bg-hHQk": [],
  });
});
