import { test } from "node:test";
import * as assert from "node:assert";
import { Send } from "../aos.helper.js";
import fs from "node:fs";

// const WarToken = "xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10";

// const exampleSender = "SOME RANDOM GUY";

test("load LlamaHerderClient module", async () => {
  const dbAdminCode = fs.readFileSync("./llm/LlamaHerderClient.lua", "utf-8");
  const result = await Send({
    Action: "Eval",
    Data: `
APM = true
local function _load()
  ${dbAdminCode}
end
_G.package.loaded["DbAdmin"] = _load()
return "ok"`,
  });
  assert.equal(result.Output.data.output, "ok");
});

test("load source", async () => {
  const code = fs.readFileSync("./llm/LlamaRouter.lua", "utf-8");
  const result = await Send({ Action: "Eval", Data: code });

  assert.equal(result.Output.data.output, "Loaded LlamaRouter");
});
