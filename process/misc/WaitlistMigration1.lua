-- ProcessId: 2dFSGGlc5xJb0sWinAnEFHM-62tQEbhDzi1v5ldWX5k

--#region Migration

local migration1 = [[
BEGIN TRANSACTION;
ALTER TABLE Waitlist
ADD COLUMN Flagged INTEGER DEFAULT 0;
ALTER TABLE Waitlist
ADD COLUMN Claimed INTEGER DEFAULT 0;
COMMIT;
]]

function WaitlistDbMigration1()
  WaitlistDb:exec(migration1)
end

--#endregion

return print("Loaded Migration1 Script")
