export class UIManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.uiElements = [
            document.getElementById('play-button'),
            document.getElementById('credits'),
            document.getElementById('nav-left'),
            document.getElementById('nav-right'),
            document.getElementById('state-menu')
        ];
        this.stateBtns = document.querySelectorAll('.state-btn');

        this.onTransition = null;
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

        this.updateActiveButton();
    }

    _handleTransition(targetState) {
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
}
