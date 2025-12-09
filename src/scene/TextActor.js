import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

export class TextActor {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.velocityX = 0;
        this.velocityY = 0;
        this.friction = 0.5;
        this.deceleration = 0.3;
        this.sensitivity = 0.5;

        this.targetInputX = 0;
        this.targetInputY = 0;
        this.smoothedInputX = 0;
        this.smoothedInputY = 0;
        this.smoothFactor = 0.05;
    }


    load() {
        return new Promise((resolve) => {
            const loader = new FontLoader();
            loader.load('/fonts/MajorMonoDisplay-Regular.json', (font) => {
                const textGeometry = new TextGeometry('muLTitask', {
                    font: font,
                    size: 12,
                    height: 2,
                    curveSegments: 12,
                    bevelEnabled: true,
                    bevelThickness: 0.3,
                    bevelSize: 0.2,
                    bevelSegments: 3
                });

                const material = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0
                });

                this.mesh = new THREE.Mesh(textGeometry, material);
                textGeometry.center();
                this.mesh.position.set(0, 20, 0);
                this.scene.add(this.mesh);

                this._updateTextScale();
                window.addEventListener('resize', () => this._updateTextScale());

                resolve(this.mesh);
            });
        });
    }

    _updateTextScale() {
        if (!this.mesh) return;
        this.mesh.scale.setScalar(1);
    }

    update(deltaInput) {
        if (!this.mesh) return;



        if (deltaInput.x !== 0 || deltaInput.y !== 0) {
            this.targetInputX = deltaInput.x * this.sensitivity;
            this.targetInputY = deltaInput.y * this.sensitivity;
        } else {
            this.targetInputX = 0;
            this.targetInputY = 0;
        }

        this.smoothedInputX += (this.targetInputX - this.smoothedInputX) * this.smoothFactor;
        this.smoothedInputY += (this.targetInputY - this.smoothedInputY) * this.smoothFactor;

        this.velocityX += this.smoothedInputX;
        this.velocityY += this.smoothedInputY;

        this.velocityX *= this.friction;
        this.velocityY *= this.friction;

        this.mesh.rotation.y += Math.tanh(this.velocityX) * this.deceleration;
        this.mesh.rotation.x += Math.tanh(this.velocityY) * this.deceleration;
    }

    setVisible(visible) {
        if (this.mesh) this.mesh.visible = visible;
    }
}
