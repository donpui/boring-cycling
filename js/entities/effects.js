import { PALETTE } from '../constants.js';

export function drawBloodSplat(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = '#d32f2f'; // Red blood color

    ctx.fillStyle = '#cc0000'; // Dark red

    // Main pool
    ctx.fillRect(x - 40, y - 10, 80, 30);
    ctx.fillRect(x - 25, y - 20, 50, 50);

    // Splatters
    ctx.fillRect(x - 50, y + 5, 15, 15);
    ctx.fillRect(x + 40, y - 5, 20, 20);
    ctx.fillRect(x - 10, y + 25, 20, 20);
    ctx.fillRect(x + 20, y - 30, 15, 15);

    // Drips
    ctx.fillRect(x - 30, y + 15, 5, 10);
    ctx.fillRect(x + 10, y + 20, 8, 12);
}
