import { initCursorHandlers } from './cursor.js';
import * as THREE from 'three';
import { createScene } from './scene.js';
import { createText } from './multitaskText.js';
import { createPostProcessing } from './postprocessing.js';
import { createBackground } from './background.js';
import { CheckOrientation } from './utils/CheckOrientation.js';
import { StateManager } from './stateManager.js';
import { UIManager } from './uiManager.js';
import { ApiService } from './apiService.js';

initCursorHandlers();

const frustumSize = 50;
const { scene, camera } = createScene(frustumSize);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

document.addEventListener("contextmenu", (event) => event.preventDefault());

const { camera: bgCamera, uniforms } = createBackground(scene);


const stateManager = new StateManager();
const uiManager = new UIManager(stateManager);
const apiService = new ApiService();

let composer, textMesh;


uiManager.init();


uiManager.onTransition = (transitionData) => {
  if (transitionData.mode === 'sequential') {
    uniforms.u_stateA.value = transitionData.stateA;
    uniforms.u_mix.value = transitionData.mix;
  } else {
    uniforms.u_stateA.value = transitionData.stateA;
    uniforms.u_stateB.value = transitionData.stateB;
    uniforms.u_mix.value = transitionData.mix;
  }
};

createText(scene).then((mesh) => {
  textMesh = mesh;
  ({ composer } = createPostProcessing(renderer, scene, camera, textMesh));

  new CheckOrientation({
    onLock: () => {
      uiManager.setElementsVisibility(false);
      if (textMesh) textMesh.visible = false;
    },
    onUnlock: () => {
      uiManager.setElementsVisibility(true);
      if (textMesh) textMesh.visible = true;
    }
  });
});

function animate() {
  const time = performance.now() * 0.001;
  uniforms.u_time.value = time;

  const updateResult = stateManager.update();
  if (updateResult) {
    if (updateResult.finished) {
      uniforms.u_stateA.value = updateResult.stateA;
      uniforms.u_stateB.value = updateResult.stateB;
      uniforms.u_mix.value = updateResult.mix;
    } else {
      if (stateManager.transitionMode === 'sequential') {
        uniforms.u_stateA.value = updateResult.stateA;
      } else {
        uniforms.u_mix.value = updateResult.mix;
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


apiService.startPing();
