import { BICYCLE_BASE_TILT, PALETTE } from '../constants.js';
import { state } from '../state.js';

export function drawBicycle(ctx) {
    const bike = state.bicycle;
    ctx.save();
    ctx.translate(bike.x + bike.width / 2, bike.y + bike.height / 2);
    ctx.rotate(((BICYCLE_BASE_TILT + bike.sway) * Math.PI) / 180);
    ctx.translate(-bike.width / 2, -bike.height / 2);

    const wheelRadius = 30;
    const frontWheelX = bike.width - 10; // Moved closer to edge
    const rearWheelX = 10; // Moved closer to edge
    const wheelY = bike.height - 10;
    const seat = { x: bike.width * 0.42, y: bike.height * 0.34 };
    const handle = { x: frontWheelX + 8, y: bike.height * 0.2 };
    const crankCenter = { x: bike.width * 0.5, y: bike.height * 0.62 };
    const crankRadius = 16;
    const crankAngle = state.wheelRotation * 0.4;

    // Wheels (Pixelated circles)
    drawPixelWheel(ctx, rearWheelX, wheelY, wheelRadius);
    drawPixelWheel(ctx, frontWheelX, wheelY, wheelRadius);

    // Frame
    ctx.lineWidth = 4;
    ctx.strokeStyle = PALETTE.foreground;
    ctx.beginPath();
    ctx.moveTo(rearWheelX, wheelY);
    ctx.lineTo(seat.x, seat.y);
    ctx.lineTo(bike.width * 0.5, bike.height * 0.48);
    ctx.lineTo(frontWheelX, wheelY - 6);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(seat.x, seat.y);
    ctx.lineTo(handle.x - 20, handle.y - 4);
    ctx.lineTo(frontWheelX, wheelY - 6);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(seat.x, seat.y);
    ctx.lineTo(crankCenter.x, crankCenter.y);
    ctx.stroke();

    // Handlebar
    ctx.strokeStyle = PALETTE.foreground;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(handle.x - 12, handle.y - 12);
    ctx.lineTo(handle.x - 4, handle.y - 30);
    ctx.lineTo(handle.x + 10, handle.y - 26);
    ctx.stroke();

    // Pedals
    const pedals = [0, Math.PI].map((offset) => ({
        x: crankCenter.x + crankRadius * Math.cos(crankAngle + offset),
        y: crankCenter.y + crankRadius * Math.sin(crankAngle + offset),
    }));

    ctx.strokeStyle = PALETTE.foreground;
    ctx.lineWidth = 4;
    for (const pedal of pedals) {
        ctx.beginPath();
        ctx.moveTo(crankCenter.x, crankCenter.y);
        ctx.lineTo(pedal.x, pedal.y);
        ctx.stroke();

        ctx.fillStyle = PALETTE.foreground;
        ctx.fillRect(pedal.x - 6, pedal.y - 2, 12, 4);
    }

    // Rider (Simplified blocky shapes)
    drawPixelRider(ctx, { seat, handle, pedals });

    ctx.restore();
}

function drawPixelWheel(ctx, x, y, radius) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = PALETTE.foreground;

    // Rim (Ring of pixels)
    const steps = 24;
    for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        ctx.fillRect(px - 2, py - 2, 4, 4);
    }

    // Center dot
    ctx.fillRect(-3, -3, 6, 6);

    // Spokes
    ctx.save();
    ctx.rotate(state.wheelRotation);
    ctx.strokeStyle = PALETTE.foreground;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-radius + 4, 0);
    ctx.lineTo(radius - 4, 0);
    ctx.moveTo(0, -radius + 4);
    ctx.lineTo(0, radius - 4);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
}

function drawPixelRider(ctx, { seat, handle, pedals }) {
    const hip = { x: seat.x + 2, y: seat.y - 10 };
    const shoulder = { x: seat.x + 20, y: seat.y - 30 };
    const head = { x: shoulder.x + 10, y: shoulder.y - 20 };

    ctx.fillStyle = PALETTE.foreground;

    // Body
    ctx.beginPath();
    ctx.moveTo(hip.x, hip.y);
    ctx.lineTo(shoulder.x, shoulder.y);
    ctx.lineTo(shoulder.x + 10, shoulder.y + 5);
    ctx.lineTo(hip.x + 10, hip.y + 5);
    ctx.fill();

    // Head (Square)
    ctx.fillRect(head.x - 10, head.y - 10, 20, 20);

    // Arms
    ctx.strokeStyle = PALETTE.foreground;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(shoulder.x, shoulder.y);
    ctx.lineTo(handle.x, handle.y);
    ctx.stroke();

    // Legs
    drawLegSegment(ctx, hip, pedals[0], 1);
    drawLegSegment(ctx, hip, pedals[1], -1);
}

function drawLegSegment(ctx, hip, pedal, bendDirection) {
    const knee = {
        x: (hip.x + pedal.x) / 2 + bendDirection * 8,
        y: (hip.y + pedal.y) / 2 - 6,
    };
    ctx.strokeStyle = PALETTE.foreground;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hip.x, hip.y);
    ctx.lineTo(knee.x, knee.y);
    ctx.lineTo(pedal.x, pedal.y);
    ctx.stroke();
}

export function getBikeCollisionRect() {
    const bike = state.bicycle;
    const paddingX = bike.width * 0.15;
    const headOffset = bike.height * 0.25;
    return {
        x: bike.x + paddingX,
        y: bike.y + headOffset,
        width: bike.width - paddingX * 2,
        height: bike.height - headOffset * 0.9,
    };
}

export function bikeRectLowerHalf(fullRect) {
    return {
        x: fullRect.x,
        y: fullRect.y + fullRect.height * 0.45,
        width: fullRect.width,
        height: fullRect.height * 0.55,
    };
}
