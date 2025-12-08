import { initCursorHandlers } from './cursor.js';
import * as THREE from 'three';
import { createScene } from './scene.js';
import { createText } from './multitaskText.js';
import { createPostProcessing } from './postprocessing.js';
import { createBackground } from './background.js';
import { CheckOrientation } from './utils/CheckOrientation.js';



initCursorHandlers();

const frustumSize = 50;
const { scene, camera } = createScene(frustumSize);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

document.addEventListener("contextmenu", (event) => event.preventDefault());

const { camera: bgCamera, uniforms } = createBackground(scene);

const uiElements = [
  document.getElementById('play-button'),
  document.getElementById('credits'),
  document.getElementById('nav-left'),
  document.getElementById('nav-right')
];

let composer, textMesh;
let targetState = 0;
const MAX_STATE = 4;

document.getElementById('nav-left').addEventListener('click', () => {
  if (targetState > 0) targetState--;
});

document.getElementById('nav-right').addEventListener('click', () => {
  if (targetState < MAX_STATE) {
    targetState++;
    console.log(`State advancing to: ${targetState}`);
  } else {
    console.log('Max state reached');
  }
});

createText(scene).then((mesh) => {
  textMesh = mesh;
  ({ composer } = createPostProcessing(renderer, scene, camera, textMesh));

  new CheckOrientation({
    onLock: () => {
      uiElements.forEach(el => el?.classList.add('hidden'));
      if (textMesh) textMesh.visible = false;
    },
    onUnlock: () => {
      uiElements.forEach(el => el?.classList.remove('hidden'));
      if (textMesh) textMesh.visible = true;
    }
  });
});

function animate() {
  const time = performance.now() * 0.001;
  uniforms.u_time.value = time;

  uniforms.u_state.value = THREE.MathUtils.lerp(uniforms.u_state.value, targetState, 0.02);

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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

setInterval(() => {
  fetch(`${API_BASE_URL}/scores/ping`, {
    headers: {
      'X-API-KEY': API_KEY
    }
  })
    .then((res) => {
      if (!res.ok) throw new Error('Error de red');
      return res.text();
    })
    .then((data) => console.log('[ping]', data))
    .catch((err) => console.error('[ping] Error de red:', err));
}, 5000);
