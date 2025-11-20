import { ROAD_PARAMS, PALETTE, CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants.js';
import { state } from '../state.js';

export function drawRoad(ctx) {
    const { bottomWidth, topWidth, horizon, shoulder } = ROAD_PARAMS;
    const center = CANVAS_WIDTH / 2;
    const depth = CANVAS_HEIGHT - horizon;
    const widthAt = (progress) => topWidth + (bottomWidth - topWidth) * progress;
    const halfWidthAt = (progress) => widthAt(progress) / 2;

    // Road background
    ctx.fillStyle = PALETTE.grayLight;
    ctx.fillRect(0, horizon, CANVAS_WIDTH, CANVAS_HEIGHT - horizon);

    // Road surface
    ctx.fillStyle = '#ffffff'; // White road for high contrast
    ctx.beginPath();
    ctx.moveTo(center - bottomWidth / 2, CANVAS_HEIGHT);
    ctx.lineTo(center - topWidth / 2, horizon);
    ctx.lineTo(center + topWidth / 2, horizon);
    ctx.lineTo(center + bottomWidth / 2, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Road borders
    ctx.strokeStyle = PALETTE.foreground;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(center - bottomWidth / 2, CANVAS_HEIGHT);
    ctx.lineTo(center - topWidth / 2, horizon);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(center + bottomWidth / 2, CANVAS_HEIGHT);
    ctx.lineTo(center + topWidth / 2, horizon);
    ctx.stroke();

    // Grid lines for retro feel
    ctx.strokeStyle = PALETTE.grayLight;
    ctx.lineWidth = 2;
    for (let i = 1; i <= 10; i += 1) {
        const progress = i / 10;
        const y = horizon + depth * progress;
        const halfWidth = halfWidthAt(progress);

        ctx.beginPath();
        ctx.moveTo(center - halfWidth, y);
        ctx.lineTo(center + halfWidth, y);
        ctx.stroke();
    }

    // Center dashes
    ctx.fillStyle = PALETTE.foreground;
    const dashCount = 14;
    const dashLength = 0.09;
    for (let i = 0; i < dashCount; i += 1) {
        const startProg = i * dashLength * 1.3 - (state.roadDashOffset / 1200);
        if (startProg > 1) break;
        const endProg = startProg + dashLength;
        if (endProg < 0) continue;
        const clampedStart = Math.max(0, startProg);
        const clampedEnd = Math.min(1, endProg);
        const y1 = horizon + depth * clampedStart;
        const y2 = horizon + depth * clampedEnd;
        const halfWidth1 = halfWidthAt(clampedStart) * 0.02;
        const halfWidth2 = halfWidthAt(clampedEnd) * 0.02;

        ctx.beginPath();
        ctx.moveTo(center - halfWidth1, y1);
        ctx.lineTo(center + halfWidth1, y1);
        ctx.lineTo(center + halfWidth2, y2);
        ctx.lineTo(center - halfWidth2, y2);
        ctx.closePath();
        ctx.fill();
    }
}
