import { dryrun } from "@permaweb/aoconnect";
import { writeFileSync } from "fs";

dryrun({
  process: "2dFSGGlc5xJb0sWinAnEFHM-62tQEbhDzi1v5ldWX5k",
  Owner: "K3FysbyRLGwzJByRZOOz1I6ybQtZI3kFNMtmkC4IkoQ",
  tags: [{ name: "Action", value: "Eval" }],
  data: `require('json').encode(WaitlistDbAdmin:exec([[
SELECT
  WalletId
FROM
  Waitlist
WHERE
  Authorised = 1
]]))`,
}).then((result) => {
  console.log(result.Output.data.output);
  writeFileSync("./misc/WaitlistAuthed.json", result.Output.data.output);
});
