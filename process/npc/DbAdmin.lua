local dbAdmin = {}
dbAdmin.__index = dbAdmin

-- Function to create a new database explorer instance
function dbAdmin.new(db)
  local self = setmetatable({}, dbAdmin)
  self.db = db
  return self
end

-- Function to list all tables in the database
function dbAdmin:tables()
  local tables = {}
  for row in self.db:nrows("SELECT name FROM sqlite_master WHERE type='table';") do
    table.insert(tables, row.name)
  end
  return tables
end

-- Function to get the record count of a table
function dbAdmin:count(tableName)
  local count_query = string.format("SELECT COUNT(*) AS count FROM %s;", tableName)
  for row in self.db:nrows(count_query) do
    return row.count
  end
end

-- Function to execute a given SQL query
function dbAdmin:exec(sql)
  local results = {}
  for row in self.db:nrows(sql) do
    table.insert(results, row)
  end
  return results
end

return dbAdmin
