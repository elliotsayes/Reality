import { message, createDataItemSigner } from "@permaweb/aoconnect";
import { whitelist } from "./WhitelistDataManual.js";
import fs from "fs";

const key = JSON.parse(
  fs.readFileSync("../.secret/deploy_sqlite_jwk.json", "utf8"),
);

async function main() {
  const signer = createDataItemSigner(key);

  const batchSize = 50;
  const whitelistBatches = [];
  for (let i = 0; i < whitelist.length; i += batchSize) {
    whitelistBatches.push(whitelist.slice(i, i + batchSize));
  }

  for (const whitelistBatch of whitelistBatches) {
    console.log(whitelistBatch);
    const now = Date.now();
    const script = whitelistBatch
      .map((walletId) => `AuthoriseWallet("${walletId}", ${now})`)
      .join("\n");
    const res = await message({
      process: "2dFSGGlc5xJb0sWinAnEFHM-62tQEbhDzi1v5ldWX5k",
      tags: [{ name: "Action", value: "Eval" }],
      data: script,
      signer,
    });
    console.log(`${whitelistBatch.length}: ${res}`);
    for (const authTarget of [
      "kPjfXLFyjJogxGRRRe2ErdYNiexolpHpK6wGkz-UPVA", // King
      "ptvbacSmqJPfgCXxPc9bcobs5Th2B_SxTf81vRNkRzk", // Banker
      "o20viT_yWRooVjt7x84mobxADRM5y2XG9WMFr7U3_KQ", // Immigration
    ]) {
      const authScript = whitelistBatch
        .map((walletId) => `AuthoriseWallet("${walletId}")`)
        .join("\n");
      const res2 = await message({
        process: authTarget,
        tags: [{ name: "Action", value: "Eval" }],
        data: authScript,
        signer,
      });
      console.log(`${authTarget[0]} ${whitelistBatch.length}: ${res2}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
}

main();
