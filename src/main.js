import './style.css';
import * as THREE from 'three';
import { createScene } from './scene.js';
import { createText } from './multitaskText.js';
import { createPostProcessing } from './postprocessing.js';
import { createBackground } from './background.js';

const { scene, camera } = createScene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
document.addEventListener("contextmenu", (event) => event.preventDefault());
const { camera: bgCamera, uniforms } = createBackground(scene);

let composer, updateGradientColor;
createText(scene).then((textMesh) => {
    ({ composer, updateGradientColor } = createPostProcessing(renderer, scene, camera, textMesh));
});

function animate() {
    const time = performance.now() * 0.001;
    uniforms.u_time.value = time;

    if (updateGradientColor) {
        updateGradientColor(time);
    }

    if (composer) composer.render();
    requestAnimationFrame(animate);
}

animate();
