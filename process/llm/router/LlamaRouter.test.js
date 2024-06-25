import { test } from "node:test";
import * as assert from "node:assert";
import { Send } from "../../aos.helper.js";
import fs from "node:fs";

const LlamaHerder = "wh5vB2IbqmIBUqgodOaTvByNFDPr73gbUq1bVOUtCrw";
const WarToken = "xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10";
const whitelistedSender = "SOME RANDOM GUY";

const exampleBaseFee = 5;
const exampleTokenFee = 2;

test("load LlamaHerderClient module", async () => {
  const llamaHerderClientCOde = fs.readFileSync(
    "./llm/router/LlamaHerderClient.lua",
    "utf-8",
  );
  const result = await Send({
    Action: "Eval",
    Data: `
APM = true
local function _load()
  ${llamaHerderClientCOde}
end
_G.package.loaded["LlamaHerderClient"] = _load()
return "ok"`,
  });
  assert.equal(result.Output.data.output, "ok");
});

test("load source", async () => {
  const code = fs.readFileSync("./llm/router/LlamaRouter.lua", "utf-8");
  const result = await Send({ Action: "Eval", Data: code });

  assert.equal(result.Output.data.output, "Loaded LlamaRouter");
});

test("load config", async () => {
  const code = fs.readFileSync("./llm/router/Config.test.lua", "utf-8");
  const result = await Send({ Action: "Eval", Data: code });

  assert.equal(result.Output.data.output, undefined);
});

test("inference off whitelist should error", async () => {
  const result = await Send({
    From: "Not the right guy",
    Action: "Inference",
    Id: "myMessageId1",
    Data: "My Prompt1",
  });

  assert.ok(result.Output.data.includes("Inference not allowed"));
});

test("inference on whitelist should call info", async () => {
  const result = await Send({
    From: whitelistedSender,
    Action: "Inference",
    Id: "myMessageId2",
    Data: "My Prompt2",
    ["Reply-To"]: "My Reply To2",
  });
  const reply = result.Messages[0];

  assert.equal(reply.Target, LlamaHerder);
  const actionTag = reply.Tags.find((t) => t.name === "Action");
  assert.equal(actionTag.value, "Info");
});

test("info response should call war", async () => {
  const result = await Send({
    // Target: msg.From,
    From: LlamaHerder,
    Action: "Info-Response",
    Name: "Llama-Herder",
    Version: "0.2",
    ["Base-Fee"]: exampleBaseFee,
    ["Token-Fee"]: exampleTokenFee,
    ["Last-Multiplier"]: "1.1",
    ["Queue-Length"]: "0",
    Data: `A decentralized service for Llama 3 inference.
    This process is a herder of Llama 3 workers. It dispatches work to
    a herd of many worker processes and forwards their responses.`,
  });
  assert.equal(result.Output.data, "LlamaHerder: Handling new price info...");

  const reply = result.Messages[0];
  assert.equal(reply.Target, WarToken);

  const actionTag = reply.Tags.find((t) => t.name === "Action");
  assert.equal(actionTag.value, "Transfer");

  const xPromptTag = reply.Tags.find((t) => t.name === "X-Prompt");
  assert.equal(xPromptTag.value, "My Prompt2");
});

test("inference response", async () => {
  const result = await Send({
    // Target = Busy[msg.From].client,
    From: LlamaHerder,
    Action: "Inference-Response",
    ["X-Reference"]: "myMessageId2",
    Data: "my inference result2",
  });
  assert.ok(
    result.Output.data.includes("LlamaRouter.InferenceResponseHandler"),
  );

  const reply = result.Messages[0];
  console.log(reply);
  assert.equal(reply.Target, "My Reply To2");
  assert.equal(reply.Data, "my inference result2");

  const actionTag = reply.Tags.find((t) => t.name === "Action");
  assert.equal(actionTag.value, "Inference-Response");
});
