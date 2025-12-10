import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

export class TextActor {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;

        this.maxRotationX = 0.15;
        this.maxRotationY = 0.22;

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
                    height: 0.2,
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

                this.mesh.castShadow = true;
                this.scene.add(this.mesh);

                const planeGeometry = new THREE.PlaneGeometry(200, 200);
                const shadowMaterial = new THREE.ShadowMaterial({
                    opacity: 0.15,
                    color: 0x000000
                });

                this.shadowUniforms = {
                    fadeStart: { value: 0.15 },
                    fadeEnd: { value: 0.31 }
                };

                shadowMaterial.onBeforeCompile = (shader) => {
                    shader.uniforms.fadeStart = this.shadowUniforms.fadeStart;
                    shader.uniforms.fadeEnd = this.shadowUniforms.fadeEnd;

                    shader.vertexShader = shader.vertexShader.replace(
                        '#include <common>',
                        `#include <common>
                        varying vec2 vUv;`
                    );
                    shader.vertexShader = shader.vertexShader.replace(
                        '#include <begin_vertex>',
                        `#include <begin_vertex>
                        vUv = uv;`
                    );

                    shader.fragmentShader = shader.fragmentShader.replace(
                        '#include <common>',
                        `#include <common>
                        uniform float fadeStart;
                        uniform float fadeEnd;
                        varying vec2 vUv;`
                    );

                    shader.fragmentShader = shader.fragmentShader.replace(
                        '#include <fog_fragment>',
                        `#include <fog_fragment>
                        float dist = distance(vUv, vec2(0.5));
                        float fade = 1.0 - smoothstep(fadeStart, fadeEnd, dist);
                        gl_FragColor.a *= fade;`
                    );
                };

                this.shadowPlane = new THREE.Mesh(planeGeometry, shadowMaterial);
                this.shadowPlane.position.set(0, 0, -1.0);
                this.shadowPlane.renderOrder = -1;
                this.shadowPlane.receiveShadow = true;
                this.scene.add(this.shadowPlane);

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

        this.mesh.rotation.x = 0;
        this.mesh.rotation.y = 0;
    }

    setVisible(visible) {
        if (this.mesh) this.mesh.visible = visible;
        if (this.shadowPlane) this.shadowPlane.visible = visible;
    }
}
