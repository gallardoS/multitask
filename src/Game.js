import * as THREE from 'three';
import { createScene } from './scene/scene.js';
import { createBackground } from './scene/background.js';
import { createPostProcessing } from './scene/postprocessing.js';
import { TextActor } from './scene/TextActor.js';
import { StateManager } from './managers/stateManager.js';
import { UIManager } from './managers/uiManager.js';
import { InputManager } from './managers/inputManager.js';
import { ScoreManager } from './managers/ScoreManager.js';
import { ApiService } from './services/apiService.js';
import { createDebugGUI } from './utils/debug.js';
import { initCursorHandlers } from './utils/cursor.js';
import { CheckOrientation } from './utils/checkOrientation.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

export class Game {
    constructor() {
        this.frustumSize = 50;
        this.debugParams = {
            followMouse: true,
            smoothFactor: 0.02,
            moveRange: 50,
            limitY: -0.7
        };

        this.init();
    }

    init() {
        initCursorHandlers();


        this.setupRenderer();
        const { scene, camera, pointLight } = createScene(this.frustumSize);
        this.scene = scene;
        this.camera = camera;
        this.pointLight = pointLight;

        this.setupBackground();


        this.stateManager = new StateManager();
        this.uiManager = new UIManager(this.stateManager);
        this.inputManager = new InputManager();
        this.scoreManager = new ScoreManager();
        this.apiService = new ApiService();


        this.textActor = new TextActor(this.scene);


        this.uiManager.init();
        this.inputManager.init();
        this.setupPostProcessing();
        this.setupInteractions();
        this.setupDebug();


        this.totalTime = 0;
        this.lastTime = performance.now();
        this.isPaused = false;

        window.addEventListener('resize', () => this.onResize());
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);

        this.apiService.startPing();
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
        document.addEventListener("contextmenu", (event) => event.preventDefault());
    }

    setupBackground() {
        const { camera: bgCamera, uniforms } = createBackground(this.scene);
        this.bgCamera = bgCamera;
        this.backgroundUniforms = uniforms;
    }

    setupPostProcessing() {
        this.postProcessingRef = { composer: null };
        this.textActor.load().then((mesh) => {
            this.textMesh = mesh;
            const { composer } = createPostProcessing(this.renderer, this.scene, this.camera, this.textMesh);
            this.composer = composer;
            this.postProcessingRef.composer = composer;

            new CheckOrientation({
                onLock: () => {
                    this.uiManager.setElementsVisibility(false);
                    this.textActor.setVisible(false);
                },
                onUnlock: () => {
                    this.uiManager.setElementsVisibility(true);
                    this.textActor.setVisible(true);
                }
            });
        });
    }

    setupInteractions() {

        this.uiManager.onTransition = (data) => this.handleTransition(data);

        this.uiManager.onPlay = () => {
            this.scoreManager.reset();
            this.scoreManager.start();
            this.triggerPlayEffect();
        };

        this.uiManager.onToggleUI = (visible) => {
            if (this.gui) visible ? this.gui.show() : this.gui.hide();
        };


        this.uiManager.initPauseMenu(
            (show) => this.togglePause(show),
            () => { // restart
                this.togglePause(false);
                this.scoreManager.reset();
                this.scoreManager.start();
                this.uiManager._handleTransition(1);
                this.uiManager.updateActiveButton();
            },
            () => { // main menu
                this.togglePause(false);
                this.scoreManager.stop();
                this.scoreManager.hide();
                this.uiManager._handleTransition(0);
                this.uiManager.updateActiveButton();
            }
        );


        window.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                if (this.stateManager.currentState > 0) {
                    this.togglePause();
                }
            }
        });


        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.stateManager.currentState > 0 && !this.isPaused) {
                    this.togglePause(true);
                }
            }
        });
    }

    setupDebug() {
        this.gui = createDebugGUI({
            scene: this.scene,
            pointLight: this.pointLight,
            textActor: this.textActor,
            debugParams: this.debugParams,
            postProcessingRef: this.postProcessingRef,
            backgroundUniforms: this.backgroundUniforms
        });
        this.gui.hide();
    }

    handleTransition(data) {

        if (data.targetState === 0) {
            if (this.textActor) {
                this.textActor.setVisible(true);
                if (this.textActor.shadowPlane && this.textActor.shadowPlane.material) {
                    this.textActor.shadowPlane.material.opacity = 0.15;
                }
            }
            if (this.composer) {
                const outlinePass = this.composer.passes.find(pass => pass instanceof OutlinePass);
                if (outlinePass) {
                    outlinePass.edgeStrength = 2;
                    outlinePass.edgeGlow = 1;
                    outlinePass.edgeThickness = 1;
                }
            }
        }


        if (this.textActor) {
            this.textActor.setState(data.targetState);
        }


        if (data.mode === 'sequential') {
            this.backgroundUniforms.u_stateA.value = data.stateA;
            this.backgroundUniforms.u_mix.value = data.mix;
        } else {
            this.backgroundUniforms.u_stateA.value = data.stateA;
            this.backgroundUniforms.u_stateB.value = data.stateB;
            this.backgroundUniforms.u_mix.value = data.mix;
        }
    }

    triggerPlayEffect() {
        if (!this.composer) return;
        const outlinePass = this.composer.passes.find(pass => pass instanceof OutlinePass);
        if (!outlinePass) return;

        const shadowMaterial = this.textActor ? this.textActor.shadowPlane.material : null;
        const startShadowOpacity = shadowMaterial ? shadowMaterial.opacity : 0;
        const startStrength = outlinePass.edgeStrength;
        const startGlow = outlinePass.edgeGlow;
        const startThickness = outlinePass.edgeThickness;

        const duration = 1000;
        const startTime = performance.now();

        const animateOutline = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - (1 - progress) * (1 - progress);

            outlinePass.edgeStrength = startStrength + (0 - startStrength) * ease;
            outlinePass.edgeGlow = startGlow + (0 - startGlow) * ease;
            outlinePass.edgeThickness = startThickness + (10 - startThickness) * ease;

            if (shadowMaterial) {
                shadowMaterial.opacity = startShadowOpacity * (1 - ease);
            }

            if (progress < 1) {
                requestAnimationFrame(animateOutline);
            } else {
                if (this.textActor) this.textActor.setVisible(false);
            }
        };
        animateOutline();
    }

    togglePause(forceState) {
        if (typeof forceState === 'boolean') {
            this.isPaused = forceState;
        } else {
            this.isPaused = !this.isPaused;
        }
        this.uiManager.togglePauseMenu(this.isPaused);

        if (this.isPaused) {
            this.scoreManager.stop();
        } else {
            this.scoreManager.start();
        }
    }

    onResize() {
        const width = Math.max(window.innerWidth, 480);
        const height = Math.max(window.innerHeight, 320);
        const aspect = width / height;

        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        if (this.camera.isOrthographicCamera) {
            this.camera.left = -this.frustumSize * aspect;
            this.camera.right = this.frustumSize * aspect;
            this.camera.top = this.frustumSize;
            this.camera.bottom = -this.frustumSize;
            this.camera.updateProjectionMatrix();
        }

        if (this.composer) {
            this.composer.setSize(width, height);
            const fxaaPass = this.composer.passes.find(p => p.material?.uniforms?.resolution);
            if (fxaaPass) {
                fxaaPass.material.uniforms['resolution'].value.set(1 / width, 1 / height);
            }
        }

        if (this.backgroundUniforms?.u_resolution) {
            this.backgroundUniforms.u_resolution.value.set(width, height);
        }
    }

    animate() {
        const now = performance.now();
        const delta = (now - this.lastTime) * 0.001;
        this.lastTime = now;

        if (this.isPaused) {
            if (this.composer) this.composer.render();
            requestAnimationFrame(this.animate);
            return;
        }

        this.totalTime += delta;
        this.backgroundUniforms.u_time.value = this.totalTime;

        const updateResult = this.stateManager.update(delta);
        if (updateResult) {
            if (updateResult.finished) {
                this.backgroundUniforms.u_stateA.value = updateResult.stateA;
                this.backgroundUniforms.u_stateB.value = updateResult.stateB;
                this.backgroundUniforms.u_mix.value = updateResult.mix;
            } else {
                if (this.stateManager.transitionMode === 'sequential') {
                    this.backgroundUniforms.u_stateA.value = updateResult.stateA;
                } else {
                    this.backgroundUniforms.u_mix.value = updateResult.mix;
                }
            }
        }

        const mouseInput = this.inputManager.getMouse();

        if (this.pointLight && this.debugParams.followMouse) {

            if (typeof this.pointLight.currentX === 'undefined') {
                this.pointLight.currentX = this.pointLight.position.x;
                this.pointLight.currentY = this.pointLight.position.y;
            }
            const targetX = mouseInput.x * this.debugParams.moveRange;
            const clampedY = Math.min(mouseInput.y, this.debugParams.limitY);
            const targetY = -clampedY * this.debugParams.moveRange;

            const smoothTime = 1.0 - Math.pow(1.0 - this.debugParams.smoothFactor, delta * 60);

            this.pointLight.currentX += (targetX - this.pointLight.currentX) * smoothTime;
            this.pointLight.currentY += (targetY - this.pointLight.currentY) * smoothTime;

            this.pointLight.position.x = this.pointLight.currentX;
            this.pointLight.position.y = this.pointLight.currentY;
        }

        this.textActor.update(mouseInput);
        if (this.composer) this.composer.render();

        requestAnimationFrame(this.animate);
    }
}
