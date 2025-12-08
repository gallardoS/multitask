import * as THREE from 'three';
import { vertexShader, fragmentShader } from './shaders.js';

export function createBackground(scene) {
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const uniforms = {
        u_time: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_stateA: { value: 0.0 },
        u_stateB: { value: 0.0 },
        u_mix: { value: 0.0 }
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    return { camera, uniforms };
}
