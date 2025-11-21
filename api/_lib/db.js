const { createClient } = require('@libsql/client');

let client;
let tableReady;

function getClient() {
    if (client) {
        return client;
    }

    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
        throw new Error('Missing Turso configuration. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
    }

    client = createClient({ url, authToken });
    return client;
}

async function ensureScoresTable() {
    if (!tableReady) {
        const db = getClient();
        tableReady = db.execute(`
            CREATE TABLE IF NOT EXISTS scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                score INTEGER NOT NULL,
                name TEXT,
                top_speed INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    return tableReady;
}

module.exports = {
    getClient,
    ensureScoresTable,
};
