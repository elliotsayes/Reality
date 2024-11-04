import { spawn, message, createDataItemSigner } from "@permaweb/aoconnect";
import fs from "fs";

const key = JSON.parse(fs.readFileSync("../.secret/personal.json", "utf8"));

const cols = 12;
const rows = 2;
const total = cols * rows;

const row_gap = 9;
const col_gap = 4;

const positions = Array.from({ length: total }, (_, i) => {
  const row = Math.floor(i / cols);
  const col = i % cols;
  const odd = col % 2 === 1;
  return [
    (col - (cols / 2 - 0.5)) * col_gap + (odd ? 0.5 : -0.5),
    (row - (rows / 2 - 0.5)) * row_gap - 0.5,
  ];
});

const orderedPositions = [
  ...positions.slice(6 + 1, 12),
  ...positions.slice(18, 24).reverse(),
  ...positions.slice(12, 18).reverse(),
  ...positions.slice(0, 6 - 1),
];

const assetProcesses = [
  "GLzqdndamqi2vc--gHRN3LzHyMP6SvRJZo2vmFjaEsY",
  "CYy93DFzjGdNqieFVmM_DA6vNwq9tsEbhHEP_RqDLiM",
  "BWFBaMrZ6Gku-80hzrkuWDInamp2ilfsBbrg-oolR8U",
  "GuiojYagV2Lrqgu-v9uUtKNCNldc8M-7RlSQC357TXo",
  "SBqchbhXocljDy1XMxv5itGr0cjzKRR-H7S3Thum90Y",
  "u7wACTVz5zyaki4ORrYu1_2QT9RJL88BYf2z3NIdpWs",
  "fK0I_qTPOmycpkNimdJs_1bdlLRSJSYVAxYZp8YczJ8",
  "Qg2bzZVVtbCTxuY-iX5rIzx2GMooFUqCvPvYuc6Mt2M",
  "N4I3V9TLYxFxfyhrFgWYLI-YZV9u9cWVi9qqxMixML8",
  "nd8P6zSwACA2fVCpX61LASYExjSW20s2LNdhclkokf0",
  "4Q13ml4iZHgHszZw8rkt5tAgatMpTHCwt37eZym7B8Q",
  "b32qUz4TxAFLQXj1E7jokB68Cu3xAt2EkCPmouMC7A4",
  "-rIvSu630eh-m7KpG-_kRIm9jW8OvD_VPt-caCgemuo",
  "YuZXg0Tgw9qcT8agaqCIdjZ_FFXFT1nSc6LfLFS-RXo",
  "qGoJncGJFa3qEPRx8qtey_gqLzzPyx63f4afqrYVBis",
  "kR1eOrN153oVAjRnhcshimzX3dcbsvGEaBdRv7-xvtM",
  "C4C5Hz-W-Rgag33pB83bj1ZBP818M4sbG9gA_RG6fuU",
  "onS1mfjtLqctr60Dw1bhotNfkmQMnPkTZbZOXbL4Vmg",
  "OnmRO00BU8VmzjU-bgEMfQozvrFB-hLMe8q8y5gAwnA",
  "dHGZ-4dJDhJn4AfAxzS1pHiVRrOWLgDezRX3pWvI4DM",
  "ElP87FCeHuoVC_1s4A3wlz7wNsG2_H-WUD0jgE_4kYI",
  "X6sEQ6QRWPsQEhM9o4Bwbw6YE4WIX-fypt49Z9a4keM",
];

const items = orderedPositions.map((position, index0) => {
  const index1 = index0 + 1;
  return {
    index0,
    index1,
    name: `[[${index1}]]`,
    position,
  };
});

console.log(items);

async function main() {
  const signer = createDataItemSigner(key);

  // for (const item of items) {
  for (const item of items) {
    console.log(item);

    // const process = await spawn({
    //   tags: [
    //     {
    //       name: "Name",
    //       value: item.name,
    //     },
    //   ],
    //   // Preview rc2 Version: 2.0.0-rc2
    //   module: "PSPMkkFrJzYI2bQbkmeEQ5ONmeR-FJZu0fNQoSCU1-I",
    //   scheduler: "fcoN_xJeisVsPXA-trzVAuIiqO3ydLQxM-L4XbrQKzY",
    //   signer,
    // });
    const process = assetProcesses[item.index0];
    if (process != "u7wACTVz5zyaki4ORrYu1_2QT9RJL88BYf2z3NIdpWs") continue;
    console.log(process);
    const targetWorld = {
      name: "TEST",
      id: "9a_YP6M7iN7b6QUoSvpoV3oe3CqxosyuJnraCucy5ss",
    }; // Placeholder
    const res0 = await message({
      process,
      tags: [{ name: "Action", value: "Eval" }],
      data: `
DOCK_WORLD = "vtxDQx59thIrSrfN7Zn8AWDz0Vy496q360eVCCtN4Gs"
DOCK_NUMBER = ${item.index1}
WARP_POSITION = {${item.position[0]}, ${item.position[1]}}
DISPLAY_NAME = "${targetWorld.name}"
WARP_TARGET_WORLD = "${targetWorld.id}"`,
      signer,
    });
    // const res1 = await message({
    //   process,
    //   tags: [{ name: "Action", value: "Eval" }],
    //   data: fs.readFileSync("./warp/atomic-asset.lua"),
    //   signer,
    // });
    // const res2 = await message({
    //   process,
    //   tags: [{ name: "Action", value: "Eval" }],
    //   data: fs.readFileSync("./warp/entity-setup-01-create.lua"),
    //   signer,
    // });
    // const res3 = await message({
    //   process,
    //   tags: [{ name: "Action", value: "Eval" }],
    //   data: fs.readFileSync("./warp/entity-setup-02-fix.lua"),
    //   signer,
    // });
    const res4 = await message({
      process,
      tags: [{ name: "Action", value: "Eval" }],
      data: fs.readFileSync("./warp/entity-update.lua"),
      signer,
    });

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
}

main();
