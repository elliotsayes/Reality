local query = [[
SELECT
  Amount / 1000000000000 as `Llama`,
  COUNT(*) AS `N`
FROM
  Emissions
GROUP BY
  Amount
]]
local res = BankerDbAdmin:exec(query)
local payouts = {}
for _, row in ipairs(res) do
  payouts[tostring(row.Llama) .. " $LLAMA"] = row.N
end
return print(payouts)
