import * as THREE from 'three';

export class StateManager {
    constructor(maxState = 5) {
        this.currentState = 0;
        this.nextState = 0;
        this.transitionProgress = 0;
        this.isTransitioning = false;
        this.transitionMode = 'crossfade';
        this.MAX_STATE = maxState;
    }

    triggerTransition(target) {
        this.isTransitioning = true;
        this.nextState = target;
        this.transitionProgress = 0;

        if (Math.abs(this.nextState - this.currentState) === 1) {
            this.transitionMode = 'sequential';
            return {
                mode: 'sequential',
                stateA: this.currentState,
                mix: 0
            };
        } else {
            this.transitionMode = 'crossfade';
            return {
                mode: 'crossfade',
                stateA: this.currentState,
                stateB: this.nextState,
                mix: 0
            };
        }
    }

    update() {
        if (!this.isTransitioning) return null;

        this.transitionProgress += 0.01;

        let result = {};

        if (this.transitionProgress >= 1.0) {
            this.transitionProgress = 1.0;
            this.isTransitioning = false;
            this.currentState = this.nextState;

            result = {
                finished: true,
                stateA: this.currentState,
                stateB: this.currentState,
                mix: 0.0
            };
        } else {
            if (this.transitionMode === 'sequential') {
                result = {
                    finished: false,
                    stateA: THREE.MathUtils.lerp(this.currentState, this.nextState, this.transitionProgress)
                };
            } else {
                result = {
                    finished: false,
                    mix: this.transitionProgress
                };
            }
        }

        return result;
    }

    canTransition() {
        return !this.isTransitioning;
    }
}
