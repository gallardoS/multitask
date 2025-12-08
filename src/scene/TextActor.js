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

        const sensitivity = 0.3; // Increased as per user request

        // Apply input impulse
        // In the original code, velocity was effectively overwritten by the latest delta.
        // Here we add the accumulated delta (which is larger), so we scale it down.
        if (deltaInput.x !== 0 || deltaInput.y !== 0) {
            this.velocityX += deltaInput.x * sensitivity;
            this.velocityY += deltaInput.y * sensitivity;
        }

        // Apply friction
        this.velocityX *= this.friction;
        this.velocityY *= this.friction;

        // Update rotation
        this.mesh.rotation.y += Math.tanh(this.velocityX) * this.deceleration;
        this.mesh.rotation.x += Math.tanh(this.velocityY) * this.deceleration;
    }

    setVisible(visible) {
        if (this.mesh) this.mesh.visible = visible;
    }
}
