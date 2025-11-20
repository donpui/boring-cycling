import { PALLET_JACK_PARAMS, ROAD_PARAMS, PALETTE, CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants.js';
import { state } from '../state.js';
import { checkCollision } from '../utils.js';

export function spawnPalletJack() {
    const side = Math.random() > 0.5 ? 'left' : 'right';
    const roadLeft = (CANVAS_WIDTH / 2) - (ROAD_PARAMS.bottomWidth / 2);
    const roadRight = (CANVAS_WIDTH / 2) + (ROAD_PARAMS.bottomWidth / 2);

    // Spawn just off-screen at the bottom or moving down
    // For "corner" effect, let's have them appear at the bottom sides

    const jack = {
        side,
        x: side === 'left' ? roadLeft - 20 : roadRight + 20 - PALLET_JACK_PARAMS.width,
        y: CANVAS_HEIGHT + 50, // Start below screen
        targetY: CANVAS_HEIGHT - 100, // Move up a bit then stop? Or just be static obstacles that appear?
        // Let's make them static obstacles that "slide in" from the side as you scroll past?
        // Actually, in an endless runner, things usually come from top (horizon) to bottom.
        // But user said "appear from corner and stick fork to the road".
        // Maybe they slide in from the side at a fixed Y relative to the player?
        // Or they are stationary objects on the side of the road that have forks sticking out.

        // Let's treat them like pedestrians but on the shoulder, with forks sticking into the lane.
        groundY: ROAD_PARAMS.horizon,
        width: PALLET_JACK_PARAMS.width,
        height: PALLET_JACK_PARAMS.height,
        forkLength: PALLET_JACK_PARAMS.forkLength,
        speed: 0, // They move with the road (relative speed handled by update)
        progress: 0, // 0 to 1 travel from horizon to bottom
    };

    state.palletJacks.push(jack);
}

export function updatePalletJacks(seconds, speedMultiplier, bikeLowerRect, triggerCrash) {
    // Spawn logic
    state.palletJackTimer -= seconds * 1000;
    if (state.palletJackTimer <= 0) {
        spawnPalletJack();
        state.palletJackTimer = PALLET_JACK_PARAMS.spawnInterval;
    }

    // Update logic
    for (const jack of state.palletJacks) {
        // Move "down" the screen as player moves forward
        // We need to simulate Z-depth movement
        jack.progress += seconds * 0.15 * speedMultiplier; // Speed of approach

        if (jack.progress > 1.2) {
            jack.remove = true;
            continue;
        }

        const depth = jack.progress;
        const roadWidth = ROAD_PARAMS.topWidth + (ROAD_PARAMS.bottomWidth - ROAD_PARAMS.topWidth) * depth;
        const roadLeft = (CANVAS_WIDTH / 2) - (roadWidth / 2);
        const roadRight = (CANVAS_WIDTH / 2) + (roadWidth / 2);

        const scale = 0.5 + depth * 1.0;
        jack.currentWidth = jack.width * scale;
        jack.currentHeight = jack.height * scale;
        jack.currentForkLength = jack.forkLength * scale;

        jack.y = ROAD_PARAMS.horizon + (CANVAS_HEIGHT - ROAD_PARAMS.horizon) * depth - jack.currentHeight;

        // Nudge the body farther onto the shoulder so it blocks less of the lane
        if (jack.side === 'left') {
            jack.x = roadLeft - jack.currentWidth * 0.85;
        } else {
            jack.x = roadRight - jack.currentWidth * 0.15;
        }

        // Collision box for forks
        // Forks stick out into the road
        let forkRect;
        if (jack.side === 'left') {
            forkRect = {
                x: jack.x + jack.currentWidth,
                y: jack.y + jack.currentHeight * 0.8,
                width: jack.currentForkLength,
                height: jack.currentHeight * 0.2
            };
        } else {
            forkRect = {
                x: jack.x - jack.currentForkLength,
                y: jack.y + jack.currentHeight * 0.8,
                width: jack.currentForkLength,
                height: jack.currentHeight * 0.2
            };
        }

        // Also check body collision
        const bodyRect = {
            x: jack.x,
            y: jack.y,
            width: jack.currentWidth,
            height: jack.currentHeight
        };

        if (checkCollision(forkRect, bikeLowerRect) || checkCollision(bodyRect, bikeLowerRect)) {
            triggerCrash('palletJack', jack.x, jack.y);
        }
    }

    state.palletJacks = state.palletJacks.filter(j => !j.remove);
}

export function drawPalletJacks(ctx) {
    for (const jack of state.palletJacks) {
        if (jack.progress < 0 || jack.progress > 1.1) continue;

        ctx.save();
        // Mirror the art if the tractor is on the right shoulder so it still faces the road
        ctx.translate(jack.x, jack.y);
        if (jack.side === 'right') {
            ctx.translate(jack.currentWidth, 0);
            ctx.scale(-1, 1);
        }

        const w = jack.currentWidth;
        const h = jack.currentHeight;
        const baseHeight = h * 0.45;
        const baseY = h - baseHeight;

        // Wheels
        const rearR = h * 0.18;
        const frontR = h * 0.14;
        ctx.fillStyle = '#1e1e1e';
        ctx.beginPath();
        ctx.arc(w * 0.28, h - rearR * 0.9, rearR, 0, Math.PI * 2);
        ctx.arc(w * 0.72, h - frontR * 0.9, frontR, 0, Math.PI * 2);
        ctx.fill();

        // Tractor body
        ctx.fillStyle = '#2f7b3c';
        ctx.fillRect(w * 0.1, baseY, w * 0.65, baseHeight);

        // Engine/front block
        ctx.fillStyle = '#3f8d4c';
        ctx.fillRect(w * 0.65, baseY + baseHeight * 0.15, w * 0.22, baseHeight * 0.85);

        // Cab
        ctx.fillStyle = '#b3e5fc';
        const cabWidth = w * 0.35;
        const cabHeight = h * 0.42;
        ctx.fillRect(w * 0.16, baseY - cabHeight + 6, cabWidth, cabHeight);
        ctx.fillStyle = '#2f7b3c';
        ctx.fillRect(w * 0.14, baseY - cabHeight, cabWidth + w * 0.12, 6); // roof line

        // Mast for forks
        ctx.fillStyle = '#4a4a4a';
        const mastWidth = w * 0.06;
        const mastHeight = baseHeight + h * 0.25;
        const mastX = w * 0.94;
        ctx.fillRect(mastX, baseY - h * 0.15, mastWidth, mastHeight);
        ctx.fillRect(mastX - 4, baseY, mastWidth + 8, 6); // crossbar

        // Forks
        const forkThickness = baseHeight * 0.13;
        const forkY = baseY + baseHeight * 0.65;
        ctx.fillRect(w, forkY, jack.currentForkLength, forkThickness);
        ctx.fillRect(w, forkY + forkThickness + 4, jack.currentForkLength * 0.9, forkThickness);

        // Outline for a chunkier, pixel-truck feel
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, baseY, w * 0.87, baseHeight); // body outline
        ctx.strokeRect(w * 0.65, baseY + baseHeight * 0.15, w * 0.22, baseHeight * 0.85); // engine outline
        ctx.strokeRect(w * 0.16, baseY - cabHeight + 6, cabWidth, cabHeight); // cab outline

        ctx.restore();
    }
}
