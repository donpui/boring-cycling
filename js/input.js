export const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
};

export function initInput(onSpace) {
    window.addEventListener('keydown', (event) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
            event.preventDefault();
        }

        if (event.code === 'ArrowLeft') {
            keys.left = true;
        } else if (event.code === 'ArrowRight') {
            keys.right = true;
        } else if (event.code === 'ArrowUp') {
            keys.up = true;
        } else if (event.code === 'ArrowDown') {
            keys.down = true;
        } else if (event.code === 'Space') {
            keys.space = true;
        }
    });

    window.addEventListener('keyup', (event) => {
        if (event.code === 'ArrowLeft') {
            keys.left = false;
        } else if (event.code === 'ArrowRight') {
            keys.right = false;
        }
    });
}
