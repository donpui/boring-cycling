import { BICYCLE_DIMENSIONS, BOSS_INTERVAL, ROAD_PARAMS, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

const roadLeft = (CANVAS_WIDTH / 2) - (ROAD_PARAMS.bottomWidth / 2);

export const state = {
    status: 'ready',
    bicycle: {
        x: roadLeft + (ROAD_PARAMS.bottomWidth - BICYCLE_DIMENSIONS.width) / 2,
        y: CANVAS_HEIGHT - 100, // Adjusted for new height
        width: BICYCLE_DIMENSIONS.width,
        height: BICYCLE_DIMENSIONS.height,
        sway: 0,
    },
    pedestrians: [],
    avoided: 0,
    spawnTimer: 0,
    spawnInterval: 2200,
    elapsed: 0,
    difficulty: 1,
    roadDashOffset: 0,
    message: 'Tap any button or press space to ride',
    wheelRotation: 0,
    speedKmh: 25,
    boss: {
        nextSpawn: BOSS_INTERVAL,
        car: null,
    },
    crashEffects: [],
    palletJacks: [],
    palletJackTimer: 0,
};

export function resetState() {
    state.status = 'playing';
    state.bicycle.x = roadLeft + (ROAD_PARAMS.bottomWidth - state.bicycle.width) / 2;
    state.bicycle.sway = 0;
    state.pedestrians = [];
    state.avoided = 0;
    state.spawnInterval = 2200;
    state.spawnTimer = state.spawnInterval * 1.2;
    state.elapsed = 0;
    state.difficulty = 1;
    state.roadDashOffset = 0;
    state.message = '';
    state.wheelRotation = 0;
    state.speedKmh = 25;
    state.boss = {
        nextSpawn: BOSS_INTERVAL,
        car: null,
    };
    state.crashEffects = [];
    state.palletJacks = [];
    state.palletJackTimer = 5000; // First spawn after 5s
}
