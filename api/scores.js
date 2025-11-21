const { getClient, ensureScoresTable } = require('./_lib/db');

module.exports = async function handler(req, res) {
    try {
        await ensureScoresTable();
    } catch (error) {
        console.error('Failed to prepare scores table', error);
        res.status(500).json({ error: 'Database is not available' });
        return;
    }

    if (req.method === 'GET') {
        await handleGetLeaderboard(req, res);
        return;
    }

    if (req.method === 'POST') {
        await handleCreateScore(req, res);
        return;
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end('Method Not Allowed');
};

async function handleGetLeaderboard(req, res) {
    try {
        const db = getClient();
        const leaderboardPromise = db.execute(`
            WITH ranked AS (
                SELECT
                    id,
                    score,
                    name,
                    top_speed,
                    created_at,
                    ROW_NUMBER() OVER (
                        PARTITION BY name
                        ORDER BY score DESC, created_at ASC
                    ) AS r
                FROM scores
                WHERE name IS NOT NULL
                    AND TRIM(name) != ''
            )
            SELECT id, score, name, top_speed, created_at
            FROM ranked
            WHERE r = 1
            ORDER BY score DESC, created_at ASC
            LIMIT 20
        `);

        const totalsPromise = db.execute('SELECT COUNT(*) AS total_runs FROM scores');

        const requestedName = normalizeName(getQueryParam(req, 'name'));
        let playerRunsPromise = Promise.resolve({ rows: [{ count: 0 }] });
        if (requestedName) {
            playerRunsPromise = db.execute({
                sql: 'SELECT COUNT(*) AS count FROM scores WHERE name = :name',
                args: { name: requestedName },
            });
        }

        const [leaderboard, totals, playerRunsResult] = await Promise.all([
            leaderboardPromise,
            totalsPromise,
            playerRunsPromise,
        ]);

        const totalRuns = Number(totals.rows?.[0]?.total_runs || totals.rows?.[0]?.count || 0);
        const playerRuns = Number(playerRunsResult.rows?.[0]?.count || 0);

        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
        res.status(200).json({
            entries: leaderboard.rows,
            stats: {
                totalRuns,
                playerRuns: requestedName ? playerRuns : 0,
                trackedName: requestedName || null,
            },
        });
    } catch (error) {
        console.error('Failed to fetch leaderboard', error);
        res.status(500).json({ error: 'Unable to load leaderboard' });
    }
}

async function handleCreateScore(req, res) {
    const payload = parseBody(req);
    const rawScore = payload.score;
    const rawSpeed = payload.topSpeed;
    const rawName = typeof payload.name === 'string' ? payload.name : null;

    if (typeof rawScore === 'undefined') {
        res.status(400).json({ error: 'Score is required' });
        return;
    }

    const score = Number(rawScore);
    if (!Number.isFinite(score) || score < 0) {
        res.status(400).json({ error: 'Score must be a positive number' });
        return;
    }

    const name = rawName && rawName.trim() !== '' ? rawName.trim().slice(0, 30) : null;
    const topSpeedVal = Number(rawSpeed);
    const topSpeed = Number.isFinite(topSpeedVal) && topSpeedVal > 0 ? Math.floor(topSpeedVal) : null;

    try {
        const db = getClient();
        const result = await db.execute({
            sql: 'INSERT INTO scores (score, name, top_speed) VALUES (:score, :name, :top_speed)',
            args: { score: Math.floor(score), name, top_speed: topSpeed },
        });

        res.status(201).json({
            id: Number(result.lastInsertRowid),
            score: Math.floor(score),
            name,
            topSpeed,
        });
    } catch (error) {
        console.error('Failed to save score', error);
        res.status(500).json({ error: 'Unable to save score' });
    }
}

function parseBody(req) {
    if (!req.body) return {};
    if (typeof req.body === 'string') {
        try {
            return JSON.parse(req.body);
        } catch (error) {
            return {};
        }
    }
    return req.body;
}

function getQueryParam(req, key) {
    if (req.query && typeof req.query[key] !== 'undefined') {
        const value = req.query[key];
        if (Array.isArray(value)) {
            return value[0];
        }
        return value;
    }

    if (!req.url) {
        return null;
    }

    try {
        const url = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
        return url.searchParams.get(key);
    } catch {
        return null;
    }
}

function normalizeName(name) {
    if (!name || typeof name !== 'string') {
        return '';
    }
    const trimmed = name.trim();
    return trimmed ? trimmed.slice(0, 30) : '';
}
