import { dryrun } from "@permaweb/aoconnect";
import { writeFileSync } from "fs";
import json2csv from "json2csv";

dryrun({
  process: "2dFSGGlc5xJb0sWinAnEFHM-62tQEbhDzi1v5ldWX5k",
  Owner: "K3FysbyRLGwzJByRZOOz1I6ybQtZI3kFNMtmkC4IkoQ",
  tags: [{ name: "Action", value: "Eval" }],
  data: "require('json').encode(WaitlistDbAdmin:exec('SELECT * FROM Waitlist WHERE ID <= 3500'))",
}).then((result) => {
  console.log(result.Output.data.output);
  writeFileSync("./misc/WaitlistDump.json", result.Output.data.output);
  // convert to csv
  // install command for json2csv: npm install json2csv
  const csv = json2csv.parse(JSON.parse(result.Output.data.output), {
    fields: [
      "Id",
      "WalletId",
      "TimestampCreated",
      "TimestampLastBumped",
      "BumpCount",
    ],
  });
  writeFileSync("./misc/WaitlistDump.csv", csv);
});
