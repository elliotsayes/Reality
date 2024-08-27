import { message, createDataItemSigner } from "@permaweb/aoconnect";
import fs from "fs";

const key = JSON.parse(fs.readFileSync("../.secret/personal.json", "utf8"));

async function main() {
  const signer = createDataItemSigner(key);

  const res = await message({
    process: "JjR8CSShot3Hgw0IFfrPfMfCXIiXtm852Wi-__elX5w",
    tags: [{ name: "Action", value: "Warp.UpdateTarget" }],
    data: JSON.stringify({
      // Target: "9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss",
      Target: "QIFgbqEmk5MyJy01wuINfcRP_erGNNbhqHRkAQjxKgg",
    }),
    signer,
  });

  console.log(res);
}

main();
