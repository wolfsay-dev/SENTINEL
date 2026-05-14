const Database = require('better-sqlite3')
const db = new Database('sentinel.db')

db.prepare(`
    CREATE TABLE IF NOT EXISTS stats (
        machine_id TEXT PRIMARY KEY,
        malware_count INTEGER
    )
`).run()

module.exports = db