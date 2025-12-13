export class UIManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.uiElements = [
            document.getElementById('main-menu'),
            document.getElementById('credits'),
            document.getElementById('nav-left'),
            document.getElementById('nav-right'),
            document.getElementById('state-menu')
        ];
        this.stateBtns = document.querySelectorAll('.state-btn');
        this.onTransition = null;
        this.onToggleUI = null;
    }

    init() {
        const navLeft = document.getElementById('nav-left');
        if (navLeft) {
            navLeft.addEventListener('click', () => {
                if (!this.stateManager.canTransition()) return;
                if (this.stateManager.currentState > 0) {
                    this._handleTransition(this.stateManager.currentState - 1);
                }
                this.updateActiveButton();
            });
        }

        const navRight = document.getElementById('nav-right');
        if (navRight) {
            navRight.addEventListener('click', () => {
                if (!this.stateManager.canTransition()) return;
                if (this.stateManager.currentState < this.stateManager.MAX_STATE) {
                    this._handleTransition(this.stateManager.currentState + 1);
                }
                this.updateActiveButton();
            });
        }

        this.stateBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.stateManager.canTransition()) return;
                const target = parseInt(btn.dataset.state);
                if (target !== this.stateManager.currentState) {
                    this._handleTransition(target);
                }
                this.updateActiveButton();
            });
        });

        const playBtn = document.getElementById('play-button');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (!this.stateManager.canTransition()) return;

                const mainMenu = document.getElementById('main-menu');
                if (mainMenu) {
                    mainMenu.classList.add('fade-out');
                }

                const targetState = 1;

                if (this.stateManager.currentState !== targetState) {
                    this._handleTransition(targetState);
                    this.updateActiveButton();
                }
            });
        }

        const uiToggle = document.getElementById('ui-toggle');
        if (uiToggle) {
            uiToggle.addEventListener('click', () => {
                const els = [
                    document.getElementById('nav-left'),
                    document.getElementById('nav-right'),
                    document.getElementById('state-menu')
                ];
                els.forEach(el => {
                    if (el) el.classList.toggle('visible-controls');
                });

                const isVisible = els[0].classList.contains('visible-controls');
                uiToggle.textContent = isVisible ? 'dev mode on' : 'dev mode off';

                if (this.onToggleUI) {
                    this.onToggleUI(isVisible);
                }
            });
        }

        this.updateActiveButton();
    }

    _handleTransition(targetState) {
        if (targetState === 0) {
            const mainMenu = document.getElementById('main-menu');
            if (mainMenu) {
                mainMenu.classList.remove('fade-out');
            }
        }

        const updateData = this.stateManager.triggerTransition(targetState);
        if (this.onTransition) {
            this.onTransition(updateData);
        }
    }

    updateActiveButton() {
        const activeState = this.stateManager.isTransitioning ? this.stateManager.nextState : this.stateManager.currentState;
        this.stateBtns.forEach(btn => {
            const s = parseInt(btn.dataset.state);
            if (s === activeState) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    setElementsVisibility(visible) {
        this.uiElements.forEach(el => {
            if (!el) return;
            if (visible) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });
    }

    initPauseMenu(onPauseToggle, onRestart, onHome) {
        const pauseMenu = document.getElementById('pause-menu');
        const resumeBtn = document.getElementById('resume-btn');
        const restartBtn = document.getElementById('restart-btn');
        const homeBtn = document.getElementById('home-btn');

        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                if (onPauseToggle) onPauseToggle(false);
            });
        }

        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (onRestart) onRestart();
            });
        }

        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                if (onHome) onHome();
            });
        }

        this.pauseMenu = pauseMenu;

    }

    togglePauseMenu(show) {
        if (this.pauseMenu) {
            if (show) {
                this.pauseMenu.classList.remove('hidden');

                void this.pauseMenu.offsetWidth;
                this.pauseMenu.classList.add('visible');
            } else {
                this.pauseMenu.classList.remove('visible');

                setTimeout(() => {
                    if (!this.pauseMenu.classList.contains('visible')) {
                        this.pauseMenu.classList.add('hidden');
                    }
                }, 300);
            }
        }
    }


}
