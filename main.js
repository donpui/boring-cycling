import { Game } from './js/game.js';
import { Scoreboard } from './js/scoreboard.js';

const canvas = document.getElementById('gameCanvas');
const scoreboard = new Scoreboard();

const footerYear = document.getElementById('footerYear');
if (footerYear) {
    footerYear.textContent = new Date().getFullYear().toString();
}

new Game(canvas, {
    onGameOver: (score, topSpeed) => scoreboard.handleGameOver(score, topSpeed),
    onGameStart: () => scoreboard.handleGameStart(),
});
