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

window.addEventListener('resize', () => {
  const width = Math.max(window.innerWidth, 480);  
  const height = Math.max(window.innerHeight, 320);
  const aspect = width / height;

  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);

  if (camera.isOrthographicCamera) {
    camera.left = -frustumSize * aspect;
    camera.right = frustumSize * aspect;
    camera.top = frustumSize;
    camera.bottom = -frustumSize;
    camera.updateProjectionMatrix();
  }

  if (composer) {
    composer.setSize(width, height);
    const fxaaPass = composer.passes.find(p => p.material?.uniforms?.resolution);
    if (fxaaPass) {
      fxaaPass.material.uniforms['resolution'].value.set(1 / width, 1 / height);
    }
  }
  
  if (uniforms?.u_resolution) {
    uniforms.u_resolution.value.set(width, height);
  }
});