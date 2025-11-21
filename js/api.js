const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        const message = await readError(response);
        throw new Error(message || `Request failed with status ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Unexpected response. Make sure API routes are running.');
    }

    try {
        return await response.json();
    } catch {
        throw new Error('Invalid JSON response from API.');
    }
}

async function readError(response) {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        return null;
    }

    try {
        const data = await response.json();
        if (data && data.error) {
            return data.error;
        }
    } catch {
        // ignore
    }
    return null;
}

export function fetchLeaderboard(playerName) {
    const url = playerName
        ? `/api/scores?name=${encodeURIComponent(playerName)}`
        : '/api/scores';
    return requestJson(url);
}

export function createScore(score, topSpeed, name) {
    const payload = { score: Math.floor(score) };
    if (typeof topSpeed !== 'undefined') {
        payload.topSpeed = Math.floor(topSpeed);
    }
    if (typeof name !== 'undefined') {
        payload.name = name;
    }

    return requestJson('/api/scores', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(payload),
    });
}

export function updateScoreName(id, name) {
    return requestJson(`/api/scores/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ name }),
    });
}
