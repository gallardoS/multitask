export class ApiService {
    constructor() {
        this.API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        this.API_KEY = import.meta.env.VITE_API_KEY;
        this.intervalId = null;
    }

    startPing(interval = 5000) {
        if (this.intervalId) return;

        this.intervalId = setInterval(() => {
            if (this.API_BASE_URL && this.API_KEY) {
                fetch(`${this.API_BASE_URL}/scores/ping`, {
                    headers: {
                        'X-API-KEY': this.API_KEY
                    }
                })
                    .then((res) => {
                        if (!res.ok) throw new Error('Network error');
                        return res.text();
                    })
                    .then((data) => console.log('[ping]', data))
                    .catch((err) => console.error('[ping] Network error:', err));
            }
        }, interval);
    }

    stopPing() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}
