import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

export function createPostProcessing(renderer, scene, camera, textMesh) {
    const composer = new EffectComposer(renderer);
    composer.setSize(window.innerWidth, window.innerHeight);

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
    outlinePass.edgeStrength = 2;
    outlinePass.edgeGlow = 1;
    outlinePass.edgeThickness = 1;

    outlinePass.visibleEdgeColor = new THREE.Color(0xffffff); 
    outlinePass.hiddenEdgeColor = new THREE.Color(0x000000); 

    composer.addPass(outlinePass);

    if (textMesh) {
        outlinePass.selectedObjects = [textMesh];
    }

    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
    composer.addPass(fxaaPass);

    return { composer };
}
