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

        if (jack.side === 'left') {
            jack.x = roadLeft - jack.currentWidth * 0.5; // Half on shoulder
        } else {
            jack.x = roadRight - jack.currentWidth * 0.5;
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
        ctx.fillStyle = '#fbc02d'; // Yellow jack

        // Body
        ctx.fillRect(jack.x, jack.y, jack.currentWidth, jack.currentHeight);

        // Handle
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(jack.x + jack.currentWidth / 2, jack.y);
        ctx.lineTo(jack.x + jack.currentWidth / 2, jack.y - jack.currentHeight * 0.8);
        ctx.stroke();

        // Forks
        ctx.fillStyle = '#fdd835';
        if (jack.side === 'left') {
            ctx.fillRect(jack.x + jack.currentWidth, jack.y + jack.currentHeight * 0.7, jack.currentForkLength, jack.currentHeight * 0.2);
        } else {
            ctx.fillRect(jack.x - jack.currentForkLength, jack.y + jack.currentHeight * 0.7, jack.currentForkLength, jack.currentHeight * 0.2);
        }

        ctx.restore();
    }
}
