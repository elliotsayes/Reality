import { message, createDataItemSigner } from "@permaweb/aoconnect";
import { whitelist } from "./WhitelistDataBatch5.js";
import fs from "fs";

const key = JSON.parse(
  fs.readFileSync("../.secret/deploy_sqlite_jwk.json", "utf8"),
);

async function main() {
  const signer = createDataItemSigner(key);

  const batchSize = 10;
  const whitelistBatches = [];
  for (let i = 0; i < whitelist.length; i += batchSize) {
    whitelistBatches.push(whitelist.slice(i, i + batchSize));
  }

  for (const whitelistBatch of whitelistBatches) {
    console.log(whitelistBatch);
    const script = whitelistBatch
      .map((walletId) => `AuthoriseWallet("${walletId}")`)
      .join("\n");
    const res = await message({
      process: "2dFSGGlc5xJb0sWinAnEFHM-62tQEbhDzi1v5ldWX5k",
      tags: [{ name: "Action", value: "Eval" }],
      data: script,
      signer,
    });
    console.log(`${whitelistBatch.length}: ${res}`);
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
}

main();
