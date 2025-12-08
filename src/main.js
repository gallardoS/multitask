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
  document.getElementById('nav-right'),
  document.getElementById('state-menu')
];

let composer, textMesh;
let currentState = 0;
let nextState = 0;
let transitionProgress = 0;
let isTransitioning = false;
let transitionMode = 'crossfade';
const MAX_STATE = 5;

const navLeft = document.getElementById('nav-left');
if (navLeft) {
  navLeft.addEventListener('click', () => {
    if (isTransitioning) return;
    if (currentState > 0) {
      triggerTransition(currentState - 1);
    }
    updateActiveButton();
  });
}

const navRight = document.getElementById('nav-right');
if (navRight) {
  navRight.addEventListener('click', () => {
    if (isTransitioning) return;
    if (currentState < MAX_STATE) {
      triggerTransition(currentState + 1);
    }
    updateActiveButton();
  });
}

const stateBtns = document.querySelectorAll('.state-btn');
stateBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (isTransitioning) return;
    const target = parseInt(btn.dataset.state);
    if (target !== currentState) {
      triggerTransition(target);
    }
    updateActiveButton();
  });
});

function triggerTransition(target) {
  isTransitioning = true;
  nextState = target;
  transitionProgress = 0;

  if (Math.abs(nextState - currentState) === 1) {
    transitionMode = 'sequential';
    uniforms.u_stateA.value = currentState;
    uniforms.u_mix.value = 0;
  } else {
    transitionMode = 'crossfade';
    uniforms.u_stateA.value = currentState;
    uniforms.u_stateB.value = nextState;
    uniforms.u_mix.value = 0;
  }
}

function updateActiveButton() {
  const activeState = isTransitioning ? nextState : currentState;
  stateBtns.forEach(btn => {
    const s = parseInt(btn.dataset.state);
    if (s === activeState) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

updateActiveButton();

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

  if (isTransitioning) {
    transitionProgress += 0.01;

    if (transitionProgress >= 1.0) {
      transitionProgress = 1.0;
      isTransitioning = false;
      currentState = nextState;

      uniforms.u_stateA.value = currentState;
      uniforms.u_stateB.value = currentState;
      uniforms.u_mix.value = 0.0;
    } else {
      if (transitionMode === 'sequential') {
        uniforms.u_stateA.value = THREE.MathUtils.lerp(currentState, nextState, transitionProgress);
      } else {
        uniforms.u_mix.value = transitionProgress;
      }
    }
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

setInterval(() => {
  if (API_BASE_URL && API_KEY) {
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
  }
}, 5000);
