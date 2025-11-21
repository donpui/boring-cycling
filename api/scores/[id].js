const { getClient, ensureScoresTable } = require('../_lib/db');

module.exports = async function handler(req, res) {
    if (req.method !== 'PATCH') {
        res.setHeader('Allow', ['PATCH']);
        res.status(405).end('Method Not Allowed');
        return;
    }

    const { id } = req.query;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
        res.status(400).json({ error: 'Invalid score id' });
        return;
    }

    const payload = parseBody(req);
    const rawName = typeof payload.name === 'string' ? payload.name : '';
    const trimmed = rawName.trim();
    const name = trimmed ? trimmed.slice(0, 64) : null;

    try {
        await ensureScoresTable();
        const db = getClient();
        const result = await db.execute({
            sql: 'UPDATE scores SET name = :name WHERE id = :id',
            args: { name, id: numericId },
        });

        if (result.rowsAffected === 0) {
            res.status(404).json({ error: 'Score not found' });
            return;
        }

        res.status(200).json({ id: numericId, name });
    } catch (error) {
        console.error('Failed to update score', error);
        res.status(500).json({ error: 'Unable to update score' });
    }
};

function parseBody(req) {
    if (!req.body) return {};
    if (typeof req.body === 'string') {
        try {
            return JSON.parse(req.body);
        } catch {
            return {};
        }
    }
    return req.body;
}
