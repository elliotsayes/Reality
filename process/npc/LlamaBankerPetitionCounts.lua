local query = [[
SELECT
  COUNT(*) AS `N`
FROM
  WarCredit
GROUP BY
  Sender
]]
local res = BankerDbAdmin:exec(query)
return print(require('json').encode(res))
