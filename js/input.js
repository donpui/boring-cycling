export const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
};

const KEY_MAP = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
    Space: 'space',
};

export function initInput(onStart = () => {}) {
    const handleKeyDown = (event) => {
        const key = KEY_MAP[event.code];
        if (!key) return;
        event.preventDefault();

        onStart();
        keys[key] = true;
    };

    const handleKeyUp = (event) => {
        const key = KEY_MAP[event.code];
        if (!key) return;
        event.preventDefault();
        keys[key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', () => {
        Object.keys(keys).forEach((key) => { keys[key] = false; });
    });

    setupButtonControls(onStart);
}

function setupButtonControls(onStart) {
    const buttons = document.querySelectorAll('[data-control]');

    buttons.forEach((button) => {
        const control = button.dataset.control;
        if (!control) return;

        const press = (event) => {
            event.preventDefault();
            onStart();
            keys[control] = true;
            button.classList.add('is-pressed');
        };

        const release = (event) => {
            event.preventDefault();
            keys[control] = false;
            button.classList.remove('is-pressed');
        };

        button.addEventListener('pointerdown', press);
        button.addEventListener('pointerup', release);
        button.addEventListener('pointercancel', release);
        button.addEventListener('pointerleave', release);
        button.addEventListener('blur', release);
    });
}
