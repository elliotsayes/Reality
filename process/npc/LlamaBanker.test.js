import { test } from "node:test";
import * as assert from "node:assert";
import { Send } from "../aos.helper.js";
import fs from "node:fs";

const WarToken = "TODO: WarProcessId";
const LlamaToken = "TODO: LlamaTokenProcessId";
const LlamaKing = "TODO: LlamaKingProcessId";

const exampleSender = "SOME RANDOM GUY";

const oneBillion = Math.pow(10, 9);
const oneBillionStr = oneBillion.toString();

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
  const code = fs.readFileSync("./npc/LlamaBanker.lua", "utf-8");
  const result = await Send({ Action: "Eval", Data: code });

  assert.equal(result.Output.data.output, undefined);
});

test("Credits from wrong source", async () => {
  const result = await Send({
    From: "Some hacker token",
    Action: "Credit-Notice",
    Amount: oneBillionStr,
  });

  assert.equal(result.Output.data, "Credit Notice not from wrapped $AR");
});

test("Credits from wAR", async () => {
  const plea = "My Plea to the king";
  const result = await Send({
    Id: "MyMessageId",
    From: WarToken,
    Action: "Credit-Notice",
    Quantity: oneBillionStr,
    Sender: exampleSender,
    ["X-Petition"]: plea,
    ["X-Sender-Name"]: "Cool guy :)",
  });

  const message = result.Messages[0];
  assert.equal(message.Target, LlamaKing);
  assert.equal(message.Data, plea);
});

test("Saved History", async () => {
  const result = await Send({
    Action: "Eval",
    Data: `require('json').encode(BankerDbAdmin:exec('SELECT * FROM WarCredit')[1])`,
  });

  assert.deepEqual(JSON.parse(result.Output.data.output), {
    MessageId: "MyMessageId",
    Quantity: oneBillion,
    Sender: "SOME RANDOM GUY",
    Timestamp: 10003,
  });
});

test("GradePetitionHandler not from King", async () => {
  const result = await Send({
    From: "Not the King",
    Action: "Grade-Petition",
    ["Original-Message"]: "MyMessageId",
    Grade: "5",
  });

  assert.equal(result.Output.data, "Petition not from LlamaKing");
});

test("GradePetitionHandler unknown msg Id", async () => {
  const result = await Send({
    From: LlamaKing,
    Action: "Grade-Petition",
    ["Original-Message"]: "Some unknown message id",
    Grade: "5",
  });

  assert.equal(result.Output.data, "Credit not found");
});

test("GradePetitionHandler happy", async () => {
  for (let i = 0; i < 10; i++) {
    const result = await Send({
      From: LlamaKing,
      Action: "Grade-Petition",
      ["Original-Message"]: "MyMessageId",
      ["Original-Sender"]: exampleSender,
      Grade: `5`,
      Timestamp: 10000000 + i * 10,
    });

    const transfer = result.Messages[0];
    assert.equal(transfer.Target, LlamaToken);
    const quantity = transfer.Tags.filter((t) => t.name === "Quantity")[0]
      .value;
    console.log(i, "emit:", quantity);

    const chatMessage = result.Messages[1];
    assert.equal(chatMessage.Target, "TODO: ChatProcessId");
    // 'Congratulations ' .. originalSender .. ', you have been granted ' .. weightedEmissions .. ' $LLAMA coins!'
    assert.equal(
      chatMessage.Data,
      `Congratulations ${exampleSender}, you have been granted ${(quantity / Math.pow(10, 12)).toFixed(2)} $LLAMA coins!`,
    );

    // const emissionsTotalResult = await Send({
    //   Action: "Eval",
    //   Data: `require('json').encode(BankerDbAdmin:exec('SELECT SUM(Amount) as Value FROM Emissions')[1].Value)`
    // })
    // console.log(i, "total:", emissionsTotalResult.Output.data.output)
  }
});

test("RequestBalanceMessage handler", async () => {
  const result = await Send({
    From: "Some random guy",
    Action: "RequestBalanceMessage",
  });

  const transfer = result.Messages[0];
  assert.equal(transfer.Target, LlamaToken);
  assert.equal(
    transfer.Tags.filter((t) => t.name === "Recipient")[0].value,
    "Some random guy",
  );
});

test("TokenBalanceResponse handler", async () => {
  const result = await Send({
    From: LlamaToken,
    Account: "Some random guy",
    Balance: (100 * Math.pow(10, 12)).toString(),
  });

  const chat = result.Messages[0];
  assert.equal(chat.Target, "TODO: ChatProcessId");
  // Data = 'Address ' .. account .. ', you currently have ' .. balance .. ' $LLAMA coins!',
  assert.equal(
    chat.Data,
    "Address Some random guy, you currently have 100.00 $LLAMA coins!",
  );
});
