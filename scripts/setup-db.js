require('dotenv').config({ path: process.env.ENV_FILE || '.env.development.local' });
const { ensureScoresTable } = require('../api/_lib/db');

async function main() {
    const dbUrl = process.env.TURSO_DATABASE_URL;
    const dbName = process.env.TURSO_DB_NAME || 'boring-cycling';

    if (!dbUrl) {
        console.error('TURSO_DATABASE_URL is not set. Please configure your environment variables before running this script.');
        process.exit(1);
    }

    try {
        await ensureScoresTable();
        console.log(`Scores table is ready in Turso database "${dbName}".`);
    } catch (error) {
        console.error('Failed to initialize the database schema.');
        console.error(error);
        process.exit(1);
    }
}

main();
