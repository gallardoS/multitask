export class ScoreManager {
    constructor() {
        this.scoreElement = document.getElementById('score-display');
        this.score = 0;
        this.interval = null;
    }

    start() {
        if (this.interval) return;
        if (this.scoreElement) {
            this.scoreElement.classList.add('visible');
        }
        this.interval = setInterval(() => {
            this.score++;
            this.updateDisplay();
        }, 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    reset() {
        this.stop();
        this.score = 0;
        this.updateDisplay();
    }

    updateDisplay() {
        if (this.scoreElement) {
            this.scoreElement.textContent = this.score;
        }
    }

    hide() {
        if (this.scoreElement) {
            this.scoreElement.classList.remove('visible');
        }
    }
}
