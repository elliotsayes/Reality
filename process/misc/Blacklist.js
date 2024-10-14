import { message, createDataItemSigner } from "@permaweb/aoconnect";
import { blacklist } from "./BlacklistData7.js";
import fs from "fs";

const key = JSON.parse(
  fs.readFileSync("../.secret/deploy_sqlite_jwk.json", "utf8"),
);

async function main() {
  const signer = createDataItemSigner(key);

  const batchSize = 50;
  const blacklistBatches = [];
  for (let i = 0; i < blacklist.length; i += batchSize) {
    blacklistBatches.push(blacklist.slice(i, i + batchSize));
  }

  for (const blacklistBatch of blacklistBatches) {
    console.log(blacklistBatch);
    const flagScript = blacklistBatch
      .map((walletId) => `FlagWallet("${walletId}")`)
      .join("\n");
    const res = await message({
      process: "2dFSGGlc5xJb0sWinAnEFHM-62tQEbhDzi1v5ldWX5k",
      tags: [{ name: "Action", value: "Eval" }],
      data: flagScript,
      signer,
    });
    console.log(`2 ${blacklistBatch.length}: ${res}`);
    for (const unauthTarget of [
      "kPjfXLFyjJogxGRRRe2ErdYNiexolpHpK6wGkz-UPVA", // King
      "ptvbacSmqJPfgCXxPc9bcobs5Th2B_SxTf81vRNkRzk", // Banker
      "o20viT_yWRooVjt7x84mobxADRM5y2XG9WMFr7U3_KQ", // Immigration
    ]) {
      const unauthScript = blacklistBatch
        .map((walletId) => `UnauthoriseWallet("${walletId}")`)
        .join("\n");
      const res2 = await message({
        process: unauthTarget,
        tags: [{ name: "Action", value: "Eval" }],
        data: unauthScript,
        signer,
      });
      console.log(`${unauthTarget[0]} ${blacklistBatch.length}: ${res2}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
}

main();
