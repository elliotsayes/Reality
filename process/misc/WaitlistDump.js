import { dryrun } from "@permaweb/aoconnect";
import { writeFileSync } from "fs";
import json2csv from "json2csv";

dryrun({
  process: "2dFSGGlc5xJb0sWinAnEFHM-62tQEbhDzi1v5ldWX5k",
  Owner: "K3FysbyRLGwzJByRZOOz1I6ybQtZI3kFNMtmkC4IkoQ",
  tags: [{ name: "Action", value: "Eval" }],
  data: `require('json').encode(WaitlistDbAdmin:exec([[
SELECT
  *
FROM
  (
    SELECT
      *,
      ROW_NUMBER() OVER (ORDER BY BumpCount DESC, TimestampLastBumped ASC) AS Rank
    FROM
      Waitlist
  )
]]))`,
}).then((result) => {
  console.log(result.Output.data.output);
  writeFileSync("./misc/WaitlistDump.json", result.Output.data.output);
  // convert to csv
  // install command for json2csv: npm install json2csv
  const csv = json2csv.parse(JSON.parse(result.Output.data.output), {
    fields: [
      "Rank",
      "Id",
      "WalletId",
      "TimestampCreated",
      "TimestampLastBumped",
      "BumpCount",
    ],
  });
  writeFileSync("./misc/WaitlistDump.csv", csv);
});
