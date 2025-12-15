import { initCursorHandlers } from './utils/cursor.js';
import { createDebugGUI } from './utils/debug.js';
import * as THREE from 'three';
import { createScene } from './scene/scene.js';
import { TextActor } from './scene/TextActor.js';
import { createPostProcessing } from './scene/postprocessing.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { createBackground } from './scene/background.js';
import { CheckOrientation } from './utils/checkOrientation.js';
import { StateManager } from './managers/stateManager.js';
import { UIManager } from './managers/uiManager.js';
import { InputManager } from './managers/inputManager.js';
import { ApiService } from './services/apiService.js';
import { ScoreManager } from './managers/ScoreManager.js';

initCursorHandlers();

const frustumSize = 50;
const { scene, camera, pointLight } = createScene(frustumSize);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

document.addEventListener("contextmenu", (event) => event.preventDefault());

const { camera: bgCamera, uniforms } = createBackground(scene);

const stateManager = new StateManager();
const uiManager = new UIManager(stateManager);
const apiService = new ApiService();
const inputManager = new InputManager();
const scoreManager = new ScoreManager();
const textActor = new TextActor(scene);
const debugParams = {
  followMouse: true,
  smoothFactor: 0.02,
  moveRange: 50,
  limitY: -0.7
};

let composer, textMesh;

uiManager.init();
inputManager.init();

uiManager.onTransition = (transitionData) => {
  if (transitionData.targetState === 0) {
    if (textActor) {
      textActor.setVisible(true);
      if (textActor.shadowPlane && textActor.shadowPlane.material) {
        textActor.shadowPlane.material.opacity = 0.15;
      }
    }

    if (postProcessingRef && postProcessingRef.composer) {
      const outlinePass = postProcessingRef.composer.passes.find(pass =>
        pass instanceof OutlinePass || (pass.constructor && pass.constructor.name === 'OutlinePass')
      );
      if (outlinePass) {
        outlinePass.edgeStrength = 2;
        outlinePass.edgeGlow = 1;
        outlinePass.edgeThickness = 1;
      }
    }
  }

  if (transitionData.mode === 'sequential') {
    uniforms.u_stateA.value = transitionData.stateA;
    uniforms.u_mix.value = transitionData.mix;
  } else {
    uniforms.u_stateA.value = transitionData.stateA;
    uniforms.u_stateB.value = transitionData.stateB;
    uniforms.u_mix.value = transitionData.mix;
  }
};

const postProcessingRef = { composer: null };

textActor.load().then((mesh) => {
  textMesh = mesh;
  ({ composer } = createPostProcessing(renderer, scene, camera, textMesh));
  postProcessingRef.composer = composer;

  new CheckOrientation({
    onLock: () => {
      uiManager.setElementsVisibility(false);
      textActor.setVisible(false);
    },
    onUnlock: () => {
      uiManager.setElementsVisibility(true);
      textActor.setVisible(true);
    }
  });
});

let totalTime = 0;
let lastTime = performance.now();

function animate() {
  const now = performance.now();
  const delta = (now - lastTime) * 0.001;
  lastTime = now;

  if (isPaused) {
    if (composer) composer.render();
    requestAnimationFrame(animate);
    return;
  }

  totalTime += delta;
  uniforms.u_time.value = totalTime;

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

  const mouseInput = inputManager.getMouse();

  if (pointLight && debugParams.followMouse) {
    if (typeof pointLight.currentX === 'undefined') {
      pointLight.currentX = pointLight.position.x;
      pointLight.currentY = pointLight.position.y;
    }

    const targetX = mouseInput.x * debugParams.moveRange;
    const clampedY = Math.min(mouseInput.y, debugParams.limitY);
    const targetY = -clampedY * debugParams.moveRange;

    pointLight.currentX += (targetX - pointLight.currentX) * debugParams.smoothFactor;
    pointLight.currentY += (targetY - pointLight.currentY) * debugParams.smoothFactor;

    pointLight.position.x = pointLight.currentX;
    pointLight.position.y = pointLight.currentY;
  }

  textActor.update(mouseInput);

  if (composer) composer.render();
  requestAnimationFrame(animate);
}

let isPaused = false;

function togglePause(forceState) {
  if (typeof forceState === 'boolean') {
    isPaused = forceState;
  } else {
    isPaused = !isPaused;
  }

  uiManager.togglePauseMenu(isPaused);

  if (isPaused) {
    scoreManager.stop();
  } else {
    scoreManager.start();
  }
}

uiManager.initPauseMenu(
  (showMenu) => togglePause(showMenu),
  () => {
    togglePause(false);
    scoreManager.reset();
    scoreManager.start();
    uiManager._handleTransition(1);
    uiManager.updateActiveButton();
  },
  () => {
    togglePause(false);
    scoreManager.stop();
    scoreManager.hide();
    uiManager._handleTransition(0);
    uiManager.updateActiveButton();
  }
);

window.addEventListener('keydown', (e) => {
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
    if (stateManager.currentState > 0) {
      togglePause();
    }
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (stateManager.currentState > 0 && !isPaused) {
      togglePause(true);
    }
  }
});

const originalAnimate = animate;
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



const gui = createDebugGUI({ scene, pointLight, textActor, debugParams, postProcessingRef, backgroundUniforms: uniforms });
gui.hide();

uiManager.onToggleUI = (visible) => {
  if (visible) {
    gui.show();
  } else {
    gui.hide();
  }
};

uiManager.onPlay = () => {
  scoreManager.reset();
  scoreManager.start();
  const composer = postProcessingRef ? postProcessingRef.composer : null;
  if (!composer) return;

  const outlinePass = composer.passes.find(pass =>
    pass instanceof OutlinePass || (pass.constructor && pass.constructor.name === 'OutlinePass')
  );

  if (!outlinePass) return;

  const shadowMaterial = textActor ? textActor.shadowPlane.material : null;
  const startShadowOpacity = shadowMaterial ? shadowMaterial.opacity : 0;

  const startStrength = outlinePass.edgeStrength;
  const startGlow = outlinePass.edgeGlow;
  const startThickness = outlinePass.edgeThickness;

  const endStrength = 0;
  const endGlow = 0;
  const endThickness = 10;

  const duration = 1000;
  const startTime = performance.now();

  function animateOutline() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const ease = 1 - (1 - progress) * (1 - progress);

    outlinePass.edgeStrength = startStrength + (endStrength - startStrength) * ease;
    outlinePass.edgeGlow = startGlow + (endGlow - startGlow) * ease;
    outlinePass.edgeThickness = startThickness + (endThickness - startThickness) * ease;

    if (shadowMaterial) {
      shadowMaterial.opacity = startShadowOpacity * (1 - ease);
    }

    if (progress < 1) {
      requestAnimationFrame(animateOutline);
    } else {
      if (textActor) {
        textActor.setVisible(false);
      }
    }
  }

  animateOutline();
};

apiService.startPing();
