local sqlite3 = require('lsqlite3')
TrackingDb = sqlite3.open_memory()
TrackingDbAdmin = require('DbAdmin').new(TrackingDb)

TrackingDbInit()

WaitlistDbAdmin:exec(string.format([[
  UPDATE Waitlist
  SET Authorised = %d,
      Claimed = %d
]], 0, 0))

return print("Reset Auth/Claim/Login")
