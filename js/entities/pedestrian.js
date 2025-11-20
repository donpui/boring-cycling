import { PEDESTRIAN_DIMENSIONS, MIN_PED_X_GAP, MIN_PED_Y_GAP, ROAD_PARAMS, PALETTE, CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants.js';
import { state } from '../state.js';

export function spawnPedestrian() {
    const roadLeft = (CANVAS_WIDTH / 2) - (ROAD_PARAMS.bottomWidth / 2);
    const roadRight = (CANVAS_WIDTH / 2) + (ROAD_PARAMS.bottomWidth / 2);

    const spawnLeft = roadLeft + 20; // Reduced padding for narrower road
    const spawnRight = roadRight - 20;

    const difficultyBoost = 1 + Math.min(state.elapsed / 90000, 1);

    for (let attempt = 0; attempt < 5; attempt += 1) {
        const centerX = spawnLeft + Math.random() * (spawnRight - spawnLeft);
        if (!canSpawnPedestrianAt(centerX)) {
            continue;
        }

        const ped = {
            centerX,
            x: centerX - PEDESTRIAN_DIMENSIONS.width / 2,
            y: ROAD_PARAMS.horizon - PEDESTRIAN_DIMENSIONS.height,
            footY: ROAD_PARAMS.horizon,
            baseWidth: PEDESTRIAN_DIMENSIONS.width,
            baseHeight: PEDESTRIAN_DIMENSIONS.height,
            width: PEDESTRIAN_DIMENSIONS.width,
            height: PEDESTRIAN_DIMENSIONS.height,
            visualScale: 1,
            speed: (120 + Math.random() * 30) * difficultyBoost,
            counted: false,
            strideOffset: Math.random() * Math.PI * 2,
        };

        state.pedestrians.push(ped);
        return true;
    }

    return false;
}

function canSpawnPedestrianAt(centerX) {
    for (const ped of state.pedestrians) {
        if (ped.y > MIN_PED_Y_GAP) {
            continue;
        }
        const existingCenter = ped.x + ped.width / 2;
        if (Math.abs(existingCenter - centerX) < MIN_PED_X_GAP) {
            return false;
        }
    }
    return true;
}

export function updatePedestrians(seconds, speedMultiplier) {
    const bikeFoot = state.bicycle.y + state.bicycle.height;

    for (const pedestrian of state.pedestrians) {
        pedestrian.footY += pedestrian.speed * seconds * speedMultiplier;
        const depth = Math.min(1.15, pedestrian.footY / CANVAS_HEIGHT);
        const scale = 0.65 + depth * 0.55;
        pedestrian.visualScale = scale;
        pedestrian.width = pedestrian.baseWidth * scale;
        pedestrian.height = pedestrian.baseHeight * scale;
        pedestrian.x = pedestrian.centerX - pedestrian.width / 2;
        pedestrian.y = pedestrian.footY - pedestrian.height;

        if (!pedestrian.counted && pedestrian.footY > bikeFoot) {
            pedestrian.counted = true;
            state.avoided += 1;
        }
    }

    // Remove off-screen pedestrians
    state.pedestrians = state.pedestrians.filter((ped) => ped.y < CANVAS_HEIGHT + ped.height);
}

export function drawPedestrians(ctx) {
    for (const ped of state.pedestrians) {
        // Shadow
        ctx.fillStyle = PALETTE.grayLight;
        ctx.fillRect(ped.centerX - ped.width * 0.2, ped.footY - 4, ped.width * 0.4, 4);

        drawPedestrianSprite(ctx, ped);
    }
}

function drawPedestrianSprite(ctx, pedestrian) {
    const baseWidth = PEDESTRIAN_DIMENSIONS.width;
    const baseHeight = PEDESTRIAN_DIMENSIONS.height;
    ctx.save();
    ctx.translate(pedestrian.centerX, pedestrian.footY);
    ctx.scale(pedestrian.visualScale, pedestrian.visualScale);
    ctx.translate(-baseWidth / 2, -baseHeight);

    const stride = Math.sin(state.elapsed * 0.008 + pedestrian.strideOffset);
    const hipY = baseHeight - 50;
    const kneeY = baseHeight - 25;
    const footY = baseHeight;
    const hipLeftX = baseWidth * 0.3;
    const hipRightX = baseWidth * 0.7;
    const legSwing = stride * 10;

    ctx.fillStyle = PALETTE.foreground;

    // Head (Square)
    ctx.fillRect(baseWidth * 0.25, 0, baseWidth * 0.5, baseWidth * 0.5);

    // Body (Block)
    ctx.fillRect(baseWidth * 0.1, baseWidth * 0.6, baseWidth * 0.8, baseHeight * 0.4);

    // Arms
    ctx.fillRect(baseWidth * 0.0, baseWidth * 0.6, baseWidth * 0.1, baseHeight * 0.3);
    ctx.fillRect(baseWidth * 0.9, baseWidth * 0.6, baseWidth * 0.1, baseHeight * 0.3);

    // Legs (Lines)
    ctx.strokeStyle = PALETTE.foreground;
    ctx.lineWidth = 6;

    // Left Leg
    ctx.beginPath();
    ctx.moveTo(hipLeftX, hipY);
    ctx.lineTo(hipLeftX - legSwing, footY);
    ctx.stroke();

    // Right Leg
    ctx.beginPath();
    ctx.moveTo(hipRightX, hipY);
    ctx.lineTo(hipRightX + legSwing, footY);
    ctx.stroke();

    ctx.restore();
}
