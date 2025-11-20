import { state, resetState } from './state.js';
import { keys, initInput } from './input.js';
import { ROAD_PARAMS, CANVAS_HEIGHT, CANVAS_WIDTH } from './constants.js';
import { drawRoad } from './entities/road.js';
import { drawBicycle, getBikeCollisionRect, bikeRectLowerHalf } from './entities/bicycle.js';
import { spawnPedestrian, updatePedestrians, drawPedestrians } from './entities/pedestrian.js';
import { updateBossCar, drawBossCar } from './entities/boss.js';
import { updatePalletJacks, drawPalletJacks } from './entities/palletJack.js';
import { drawBloodSplat } from './entities/effects.js';
import { checkCollision } from './utils.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false; // Important for pixel art

        this.lastTime = 0;

        initInput(() => {
            if (state.status !== 'playing') {
                this.reset();
            }
        });

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    reset() {
        resetState();
    }

    triggerCrash(cause = 'generic', x = 0, y = 0) {
        state.status = 'gameover';
        state.message = 'CRASHED! TAP ANY BUTTON OR PRESS SPACE';

        // Blood for obstacle if applicable
        if (cause === 'pedestrian') {
            state.crashEffects.push({ x, y });
        }

        // Blood for cyclist
        state.crashEffects.push({
            x: state.bicycle.x + state.bicycle.width / 2,
            y: state.bicycle.y + state.bicycle.height
        });
    }

    update(delta) {
        const seconds = delta / 1000;
        const direction = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
        const moveSpeed = 320;

        if (state.status === 'playing') {
            // Move bicycle
            const bikeMoveSpeed = 300 * seconds;
            const bikeVerticalSpeed = 150 * seconds; // Slower vertical movement
            if (keys.left) state.bicycle.x -= bikeMoveSpeed;
            if (keys.right) state.bicycle.x += bikeMoveSpeed;

            // Vertical movement
            if (keys.up) state.bicycle.y -= bikeVerticalSpeed;
            if (keys.down) state.bicycle.y += bikeVerticalSpeed;

            // Clamp bicycle position
            // Horizontal
            const roadLeft = (CANVAS_WIDTH / 2) - (ROAD_PARAMS.bottomWidth / 2);
            const roadRight = (CANVAS_WIDTH / 2) + (ROAD_PARAMS.bottomWidth / 2);
            state.bicycle.x = Math.max(roadLeft - 20, Math.min(roadRight - state.bicycle.width + 20, state.bicycle.x));

            // Vertical clamp
            const minY = ROAD_PARAMS.horizon;
            const maxY = CANVAS_HEIGHT - state.bicycle.height - 10;
            state.bicycle.y = Math.max(minY, Math.min(maxY, state.bicycle.y));

            // Sway effect
            state.bicycle.sway = Math.sin(Date.now() / 200) * 2;

            // Update road animation only if playing
            state.roadDashOffset = (state.roadDashOffset + seconds * 220) % 60;
        } else {
            state.bicycle.sway *= 0.8;
        }

        const wheelSpinSpeed = state.status === 'playing' ? 4 + state.difficulty * 1.5 : 0; // Reduced from 7.5 + diff*2
        state.wheelRotation = (state.wheelRotation + wheelSpinSpeed * seconds * 10) % (Math.PI * 2);

        if (state.status !== 'playing') {
            return;
        }

        state.elapsed += delta;
        // Slower difficulty ramp: max 1.4x after 3 minutes (180000ms) instead of 1 minute
        const difficultyRamp = 1 + Math.min(state.elapsed / 180000, 0.4);
        state.difficulty = difficultyRamp;
        // Display a road speed starting at 25 km/h, climbing by ~1 km/h every 5 seconds of play
        state.speedKmh = Math.min(120, Math.floor(25 + state.elapsed / 5000));
        this.updateCounters();

        state.spawnInterval = Math.max(700, 2200 - state.elapsed / 40); // Slower spawn rate increase
        state.spawnTimer -= delta;
        if (state.spawnTimer <= 0) {
            const spawned = spawnPedestrian();
            state.spawnTimer = spawned ? state.spawnInterval : state.spawnInterval * 0.4;
        }

        const speedMultiplier = 1 + state.elapsed / 120000; // Slower speed increase

        const bikeRect = getBikeCollisionRect();
        const bikeLowerRect = bikeRectLowerHalf(bikeRect);

        updatePedestrians(seconds, speedMultiplier);

        // Check collisions for pedestrians
        for (const ped of state.pedestrians) {
            const pedRect = {
                x: ped.x + ped.width * 0.15,
                y: ped.y + ped.height * 0.5,
                width: ped.width * 0.7,
                height: ped.height * 0.45,
            };

            if (checkCollision(pedRect, bikeLowerRect)) {
                this.triggerCrash('pedestrian', ped.centerX, ped.footY);
                break;
            }
        }

        updateBossCar(seconds, speedMultiplier, bikeLowerRect, () => this.triggerCrash('car'));
        updatePalletJacks(seconds, speedMultiplier, bikeLowerRect, (cause, x, y) => this.triggerCrash(cause, x, y));
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background (white/clear)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        drawRoad(this.ctx);

        for (const effect of state.crashEffects) {
            drawBloodSplat(this.ctx, effect.x, effect.y);
        }

        drawPedestrians(this.ctx);
        drawPalletJacks(this.ctx);
        drawBossCar(this.ctx);
        drawBicycle(this.ctx);
        this.drawHUD();

        if (state.status !== 'playing') {
            this.drawMessage(state.message || 'TAP ANY BUTTON OR PRESS SPACE');
        }
    }

    drawHUD() {
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '16px "Press Start 2P", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        const hudText = `SCORE ${state.avoided}   SPEED ${state.speedKmh} km/h`;
        this.ctx.fillText(hudText, 12, 8);

        if (state.boss.car) {
            this.ctx.fillStyle = '#ff0000'; // Alert color
            this.ctx.fillText('BOSS!', 12, 32);
        }
    }

    drawMessage(text) {
        this.ctx.save();
        const padding = 14;
        const boxWidth = this.canvas.width - 24; // leave small margin
        const maxTextWidth = boxWidth - padding * 2;
        const lineHeight = 22;

        this.ctx.font = '18px "Press Start 2P", monospace';
        const lines = [];
        const words = text.split(' ');
        let current = '';
        for (const word of words) {
            const testLine = current ? `${current} ${word}` : word;
            if (this.ctx.measureText(testLine).width <= maxTextWidth) {
                current = testLine;
            } else {
                if (current) lines.push(current);
                current = word;
            }
        }
        if (current) lines.push(current);

        const boxHeight = lines.length * lineHeight + padding * 2;
        const boxX = (this.canvas.width - boxWidth) / 2;
        const boxY = (this.canvas.height - boxHeight) / 2;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        this.ctx.fillStyle = '#000000';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        lines.forEach((line, index) => {
            this.ctx.fillText(line, boxX + padding, boxY + padding + index * lineHeight);
        });
        this.ctx.restore();
    }

    updateCounters() {
        // Optional: Update DOM elements if we want to keep them, 
        // but we are drawing to canvas now for the retro feel.
        // We can remove the DOM counters or keep them as backup.
        const avoidedEl = document.getElementById('avoidedCount');
        const speedEl = document.getElementById('challengeLevel');
        if (avoidedEl) avoidedEl.textContent = state.avoided.toString();
        if (speedEl) speedEl.textContent = `${state.speedKmh} km/h`;
    }

    loop(timestamp) {
        const delta = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(delta);
        this.draw();

        requestAnimationFrame(this.loop);
    }
}
