import { BOSS_CAR_BASE, BOSS_INTERVAL, ROAD_PARAMS, PALETTE, CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants.js';
import { state } from '../state.js';
import { checkCollision } from '../utils.js';

export function spawnBossCar() {
    const lanePadding = 100;
    const roadLeft = (CANVAS_WIDTH / 2) - (ROAD_PARAMS.bottomWidth / 2);
    const roadRight = (CANVAS_WIDTH / 2) + (ROAD_PARAMS.bottomWidth / 2);

    const minX = roadLeft + lanePadding;
    const maxX = roadRight - lanePadding;
    const centerX = minX + Math.random() * (maxX - minX);

    state.boss.car = {
        centerX,
        baseWidth: BOSS_CAR_BASE.width,
        baseHeight: BOSS_CAR_BASE.height,
        width: BOSS_CAR_BASE.width * 0.6,
        height: BOSS_CAR_BASE.height * 0.6,
        x: centerX - (BOSS_CAR_BASE.width * 0.6) / 2,
        y: ROAD_PARAMS.horizon - BOSS_CAR_BASE.height * 0.6 - 40,
        groundY: ROAD_PARAMS.horizon,
        speed: 280 + state.difficulty * 50, // Reduced from 360
    };
}

export function updateBossCar(seconds, speedMultiplier, bikeLowerRect, triggerCrash) {
    const boss = state.boss;

    if (!boss.car && state.elapsed >= boss.nextSpawn) {
        spawnBossCar();
    }

    const car = boss.car;
    if (!car) {
        return;
    }

    car.groundY += car.speed * seconds * (0.9 + speedMultiplier * 0.4);
    const travel =
        (car.groundY - ROAD_PARAMS.horizon) / (CANVAS_HEIGHT - ROAD_PARAMS.horizon + 200);
    const clampedTravel = Math.max(0, Math.min(1.3, travel));
    const scale = 0.5 + clampedTravel * 0.9;
    car.width = car.baseWidth * scale;
    car.height = car.baseHeight * scale;

    const roadLeft = (CANVAS_WIDTH / 2) - (ROAD_PARAMS.bottomWidth / 2);
    const roadRight = (CANVAS_WIDTH / 2) + (ROAD_PARAMS.bottomWidth / 2);

    const clampedCenter = Math.max(
        roadLeft + car.width / 2 + 20,
        Math.min(roadRight - car.width / 2 - 20, car.centerX)
    );
    car.x = clampedCenter - car.width / 2;
    car.y = car.groundY - car.height;

    const carRect = {
        x: car.x + car.width * 0.12,
        y: car.y + car.height * 0.5,
        width: car.width * 0.76,
        height: car.height * 0.45,
    };

    if (checkCollision(carRect, bikeLowerRect)) {
        triggerCrash();
    }

    if (car.y > CANVAS_HEIGHT + car.height * 0.2) {
        boss.car = null;
        boss.nextSpawn += BOSS_INTERVAL;
    }
}

export function drawBossCar(ctx) {
    const car = state.boss.car;
    if (!car) {
        return;
    }

    ctx.save();

    // Shadow
    ctx.fillStyle = PALETTE.grayLight;
    ctx.fillRect(car.x + 20, car.groundY - 10, car.width - 40, 10);

    ctx.fillStyle = PALETTE.foreground;

    // Main body (Blocky)
    ctx.fillRect(car.x, car.y + car.height * 0.4, car.width, car.height * 0.6);

    // Cabin
    ctx.fillRect(car.x + car.width * 0.15, car.y, car.width * 0.7, car.height * 0.4);

    // Windows (White/Background color)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(car.x + car.width * 0.2, car.y + 10, car.width * 0.6, car.height * 0.25);

    // Lights
    ctx.fillStyle = PALETTE.grayLight;
    ctx.fillRect(car.x + 10, car.y + car.height - 20, 20, 10);
    ctx.fillRect(car.x + car.width - 30, car.y + car.height - 20, 20, 10);

    ctx.restore();
}
