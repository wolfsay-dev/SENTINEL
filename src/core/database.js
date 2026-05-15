const Database = require('better-sqlite3')

const db = new Database('sentinel.db')

db.prepare(`
    CREATE TABLE IF NOT EXISTS stats (
        id INTEGER PRIMARY KEY,
        malware_count INTEGER
    )
`).run()

const row = db.prepare(`
    SELECT * FROM stats WHERE id = 1
`).get()

if (!row) {

    db.prepare(`
        INSERT INTO stats (id, malware_count)
        VALUES (1, 0)
    `).run()

}

module.exports = db