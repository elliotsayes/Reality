local sqlite3 = require('lsqlite3')
BankerDb = sqlite3.open_memory()
BankerDbAdmin = require('DbAdmin').new(BankerDb)

InitDb()

return print("Reset LlamaBanker History")
