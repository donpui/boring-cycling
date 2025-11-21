import { fetchLeaderboard, createScore, updateScoreName } from './api.js';

export class Scoreboard {
    constructor() {
        this.lastScoreId = null;
        this.lastScoreValue = 0;
        this.storageKey = 'boring-cycling-name';
        this.storedName = this.loadStoredName();
        this.form = document.getElementById('scoreForm');
        this.nameInput = document.getElementById('playerName');
        this.saveButton = document.getElementById('saveScoreButton');
        this.statusEl = document.getElementById('scoreStatus');
        this.lastScoreEl = document.getElementById('lastScore');
        this.container = document.querySelector('.score-submit');
        this.leaderboardList = document.getElementById('leaderboardList');
        this.leaderboardEmpty = document.getElementById('leaderboardEmpty');
        this.overallRidesEl = document.getElementById('overallRides');
        this.playerRidesEl = document.getElementById('playerRides');
        this.playerRidesLabel = document.getElementById('playerRidesLabel');
        this.playerRidesHint = document.getElementById('playerRidesHint');

        this.handleSubmit = this.handleSubmit.bind(this);

        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit);
        }

        if (this.nameInput && this.storedName) {
            this.nameInput.value = this.storedName;
        }
        this.updatePlayerLabel();

        this.handleGameStart();
        this.refreshLeaderboard();
    }

    handleGameStart() {
        this.lastScoreId = null;
        this.lastScoreValue = 0;
        if (this.lastScoreEl) {
            this.lastScoreEl.textContent = '0';
        }
        if (this.nameInput) {
            this.nameInput.value = this.storedName || '';
        }
        this.updatePlayerLabel();
        this.setStatus('');
        this.toggleForm(false);
        this.setBusy(false);
    }

    async handleGameOver(score, topSpeed) {
        this.lastScoreValue = score;
        if (this.lastScoreEl) {
            this.lastScoreEl.textContent = score.toString();
        }

        this.toggleForm(true);
        this.setBusy(true);
        this.setStatus('Saving your score...');

        let shouldRefresh = false;
        try {
            const record = await createScore(score, topSpeed);
            this.lastScoreId = record.id;
            if (this.storedName) {
                await this.saveNameToScore(this.storedName);
                this.setStatus(`Saved as ${this.storedName}.`, 'success');
            } else {
                this.setStatus('Score saved. Add your name to appear on the leaderboard.', 'success');
            }
            shouldRefresh = true;
        } catch (error) {
            console.error(error);
            this.setStatus('Could not save the score. Please check your connection.', 'error');
            this.toggleForm(false);
        } finally {
            this.setBusy(false);
            if (shouldRefresh) {
                await this.refreshLeaderboard();
            }
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        if (!this.lastScoreId) {
            this.setStatus('Finish a run to save your score.', 'error');
            return;
        }

        const name = this.nameInput ? this.nameInput.value.trim() : '';
        if (!name) {
            this.setStatus('Score saved anonymously. Enter a name to feature on the leaderboard.', 'info');
            return;
        }

        this.setBusy(true);
        try {
            await this.saveNameToScore(name);
            this.setStatus('Name saved! You are on the leaderboard.', 'success');
            await this.refreshLeaderboard();
        } catch (error) {
            console.error(error);
            this.setStatus('Unable to save your name right now.', 'error');
        } finally {
            this.setBusy(false);
        }
    }

    async saveNameToScore(name) {
        if (!this.lastScoreId) return;
        const trimmed = name.trim();
        await updateScoreName(this.lastScoreId, trimmed);
        this.setStoredName(trimmed);
        if (this.nameInput) {
            this.nameInput.value = trimmed;
        }
    }

    async refreshLeaderboard() {
        if (!this.leaderboardList) return;
        this.showLeaderboardMessage('Loading leaderboard...', false);
        try {
            const playerName = this.storedName || undefined;
            const data = await fetchLeaderboard(playerName);
            this.renderLeaderboard(data.entries || []);
            this.updateStats(data.stats || {}, playerName);
        } catch (error) {
            console.error(error);
            this.showLeaderboardMessage('Unable to load leaderboard. Try again later.', true);
            this.updateStats({}, this.storedName || undefined);
        }
    }

    renderLeaderboard(entries) {
        if (!this.leaderboardList) return;
        this.leaderboardList.innerHTML = '';

        if (!entries.length) {
            this.showLeaderboardMessage('No named riders yet. Be the first!', false);
            return;
        }

        this.showLeaderboardMessage('', false);

        const best = entries[0];
        entries.forEach((entry, index) => {
            const item = document.createElement('li');
            item.className = 'leaderboard__item';
            item.innerHTML = `
                <span class="leaderboard__rank">${index + 1}.</span>
                <span class="leaderboard__info">
                    <span class="leaderboard__name">${escapeHtml(entry.name)}</span>
                    <span class="leaderboard__speed">${formatSpeed(entry.top_speed)}</span>
                </span>
                <span class="leaderboard__score">${entry.score}</span>
            `;
            this.leaderboardList.appendChild(item);
        });
    }

    toggleForm(isVisible) {
        if (!this.container) return;
        this.container.hidden = !isVisible;
    }

    setBusy(isBusy) {
        if (this.saveButton) {
            this.saveButton.disabled = isBusy;
        }
        if (this.nameInput) {
            this.nameInput.disabled = isBusy;
        }
    }

    setStatus(message, tone = '') {
        if (!this.statusEl) return;
        this.statusEl.textContent = message;
        this.statusEl.dataset.tone = tone;
    }

    showLeaderboardMessage(message, isError) {
        if (this.leaderboardEmpty) {
            this.leaderboardEmpty.textContent = message;
            this.leaderboardEmpty.hidden = !message;
            this.leaderboardEmpty.dataset.tone = isError ? 'error' : '';
        }
    }

    updateStats(stats = {}, playerName) {
        if (this.overallRidesEl) {
            const total = Number(stats.totalRuns || 0);
            this.overallRidesEl.textContent = total.toLocaleString();
        }

        const trackedName = stats.trackedName || '';
        const nameMatches = playerName && trackedName && trackedName.toLowerCase() === playerName.toLowerCase();
        const playerCount = nameMatches ? Number(stats.playerRuns || 0) : 0;
        if (this.playerRidesEl) {
            this.playerRidesEl.textContent = playerCount.toLocaleString();
        }
        if (this.playerRidesHint) {
            this.playerRidesHint.hidden = Boolean(this.storedName);
        }
        this.updatePlayerLabel();
    }

    updatePlayerLabel() {
        if (!this.playerRidesLabel) return;
        if (this.storedName) {
            this.playerRidesLabel.textContent = `${this.storedName}'s rides`;
        } else {
            this.playerRidesLabel.textContent = 'Your rides';
        }
        if (this.playerRidesHint) {
            this.playerRidesHint.hidden = Boolean(this.storedName);
        }
    }

    loadStoredName() {
        try {
            return window.localStorage.getItem(this.storageKey) || '';
        } catch {
            return '';
        }
    }

    setStoredName(name) {
        const trimmed = name.trim();
        this.storedName = trimmed;
        try {
            if (trimmed) {
                window.localStorage.setItem(this.storageKey, trimmed);
            } else {
                window.localStorage.removeItem(this.storageKey);
            }
        } catch {
            // ignore storage errors
        }
        this.updatePlayerLabel();
        return trimmed;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatSpeed(speed) {
    if (!speed || speed <= 0) {
        return '';
    }
    return `${speed} km/h`;
}
