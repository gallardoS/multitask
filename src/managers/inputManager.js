export class InputManager {
    constructor() {
        this.mouse = { x: 0, y: 0 };
        this.delta = { x: 0, y: 0 };
    }

    init() {
        document.addEventListener('pointermove', (event) => {
            const newX = (event.clientX / window.innerWidth) * 2 - 1;
            const newY = (event.clientY / window.innerHeight) * 2 - 1;

            this.delta.x += newX - this.mouse.x;
            this.delta.y += newY - this.mouse.y;

            this.mouse.x = newX;
            this.mouse.y = newY;
        });
    }

    getDelta() {
        const d = { ...this.delta };
        this.delta.x = 0;
        this.delta.y = 0;
        return d;
    }
}
