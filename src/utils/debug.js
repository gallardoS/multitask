import GUI from 'lil-gui';
import * as THREE from 'three';

import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

export function createDebugGUI({ scene, pointLight, textActor, debugParams, postProcessingRef }) {
    const gui = new GUI({ title: 'Shadow Debugger' });

    if (pointLight) {
        const lightingFolder = gui.addFolder('Lighting');

        const params = { showHelper: false };

        if (debugParams) {
            lightingFolder.add(debugParams, 'followMouse').name('Follow Mouse');

            const moveFolder = lightingFolder.addFolder('Movement Params');
            moveFolder.add(debugParams, 'smoothFactor', 0.001, 0.2).name('Friction/Smooth');
            moveFolder.add(debugParams, 'moveRange', 0, 200).name('Range');
        }

        lightingFolder.add(pointLight.position, 'x', -200, 200);
        lightingFolder.add(pointLight.position, 'y', -200, 200);
        lightingFolder.add(pointLight.position, 'z', -200, 200);
        lightingFolder.add(pointLight, 'intensity', 0, 20);

        const helper = new THREE.PointLightHelper(pointLight, 10);
        lightingFolder.add(params, 'showHelper').name('Show Helper').onChange((value) => {
            if (value) scene.add(helper);
            else scene.remove(helper);
        });

        lightingFolder.close();
    }

    const checkInterval = setInterval(() => {
        const composer = postProcessingRef ? postProcessingRef.composer : null;

        if (textActor && textActor.mesh && textActor.shadowPlane && composer) {
            clearInterval(checkInterval);

            const textActorFolder = gui.addFolder('Text Actor');
            textActorFolder.close();

            const textPosFolder = textActorFolder.addFolder('Position');
            textPosFolder.add(textActor.mesh.position, 'x', -100, 100);
            textPosFolder.add(textActor.mesh.position, 'y', -100, 100);
            textPosFolder.add(textActor.mesh.position, 'z', -100, 100);

            const rotationFolder = textActorFolder.addFolder('Rotation');
            rotationFolder.add(textActor.mesh.rotation, 'x', -Math.PI, Math.PI).name('Rotate X');
            rotationFolder.add(textActor.mesh.rotation, 'y', -Math.PI, Math.PI).name('Rotate Y');
            rotationFolder.add(textActor.mesh.rotation, 'z', -Math.PI, Math.PI).name('Rotate Z');

            const scaleFolder = textActorFolder.addFolder('Scale');
            scaleFolder.add(textActor.mesh.scale, 'x', 0.1, 5).name('Scale X');
            scaleFolder.add(textActor.mesh.scale, 'y', 0.1, 5).name('Scale Y');
            scaleFolder.add(textActor.mesh.scale, 'z', 0.1, 5).name('Scale Z');

            const shadowsFolder = gui.addFolder('Shadows');
            shadowsFolder.close();

            const plane = textActor.shadowPlane;

            shadowsFolder.add(plane.position, 'z', -20, 5).name('Distance (Z)');
            shadowsFolder.add(plane.material, 'opacity', 0, 1).name('Opacity');

            if (textActor.shadowUniforms) {
                const fadeFolder = shadowsFolder.addFolder('Vignette / Fade');
                fadeFolder.add(textActor.shadowUniforms.fadeStart, 'value', 0, 1).name('Fade Start (Radius)');
                fadeFolder.add(textActor.shadowUniforms.fadeEnd, 'value', 0, 1).name('Fade End (Radius)');
            }

            const ppFolder = gui.addFolder('Post-Processing');
            ppFolder.close();

            const outlinePass = composer.passes.find(pass => pass instanceof OutlinePass);

            if (outlinePass) {
                const outlineFolder = ppFolder.addFolder('Outline Settings');
                outlineFolder.add(outlinePass, 'edgeStrength', 0, 10).name('Strength');
                outlineFolder.add(outlinePass, 'edgeGlow', 0, 5).name('Glow');
                outlineFolder.add(outlinePass, 'edgeThickness', 0, 5).name('Thickness');
                outlineFolder.add(outlinePass, 'pulsePeriod', 0, 5).name('Pulse Period');
                outlineFolder.add(outlinePass, 'downSampleRatio', 1, 4, 1).name('DownSample Ratio').onChange(() => {
                    composer.setSize(window.innerWidth, window.innerHeight);
                });

                const params = {
                    visibleColor: outlinePass.visibleEdgeColor.getHex(),
                    hiddenColor: outlinePass.hiddenEdgeColor.getHex()
                };

                outlineFolder.addColor(params, 'visibleColor').name('Visible Color').onChange((val) => {
                    outlinePass.visibleEdgeColor.setHex(val);
                });
                outlineFolder.addColor(params, 'hiddenColor').name('Hidden Color').onChange((val) => {
                    outlinePass.hiddenEdgeColor.setHex(val);
                });
            }
        }
    }, 500);

    return gui;
}
