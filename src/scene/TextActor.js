import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

export class TextActor {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;

        this.maxRotationX = 0.15; // ~8.5 degrees
        this.maxRotationY = 0.22; // ~12.5 degrees

        this.currentRotationX = 0;
        this.currentRotationY = 0;
        this.smoothFactor = 0.01;
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

    update(mouseInput) {
        if (!this.mesh) return;

        const targetRotY = -mouseInput.x * this.maxRotationY;
        const targetRotX = -mouseInput.y * this.maxRotationX;

        this.currentRotationY += (targetRotY - this.currentRotationY) * this.smoothFactor;
        this.currentRotationX += (targetRotX - this.currentRotationX) * this.smoothFactor;

        this.mesh.rotation.y = this.currentRotationY;
        this.mesh.rotation.x = this.currentRotationX;
    }

    setVisible(visible) {
        if (this.mesh) this.mesh.visible = visible;
    }
}
