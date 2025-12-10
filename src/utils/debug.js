import GUI from 'lil-gui';
import * as THREE from 'three';

export function createDebugGUI({ scene, pointLight, textActor, debugParams }) {
    const gui = new GUI({ title: 'Shadow Debugger' });

    if (pointLight) {
        const folder = gui.addFolder('Point Light');
        const params = { showHelper: false };

        if (debugParams) {
            folder.add(debugParams, 'followMouse').name('Follow Mouse');

            const moveFolder = folder.addFolder('Movement Params');
            moveFolder.add(debugParams, 'smoothFactor', 0.001, 0.2).name('Friction/Smooth');
            moveFolder.add(debugParams, 'moveRange', 0, 200).name('Range');
        }

        folder.add(pointLight.position, 'x', -200, 200);
        folder.add(pointLight.position, 'y', -200, 200);
        folder.add(pointLight.position, 'z', -200, 200);
        folder.add(pointLight, 'intensity', 0, 20);

        const helper = new THREE.PointLightHelper(pointLight, 10);
        folder.add(params, 'showHelper').name('Show Helper').onChange((value) => {
            if (value) scene.add(helper);
            else scene.remove(helper);
        });

        folder.open();
    }

    const checkInterval = setInterval(() => {
        if (textActor && textActor.mesh && textActor.shadowPlane) {
            clearInterval(checkInterval);

            const textFolder = gui.addFolder('Text Position');
            textFolder.add(textActor.mesh.position, 'x', -100, 100);
            textFolder.add(textActor.mesh.position, 'y', -100, 100);
            textFolder.add(textActor.mesh.position, 'z', -100, 100);
            textFolder.open();

            const scaleFolder = gui.addFolder('Text Scale');
            scaleFolder.add(textActor.mesh.scale, 'x', 0.1, 5).name('Scale X');
            scaleFolder.add(textActor.mesh.scale, 'y', 0.1, 5).name('Scale Y');
            scaleFolder.add(textActor.mesh.scale, 'z', 0.1, 5).name('Scale Z');
            scaleFolder.open();

            const planeFolder = gui.addFolder('Shadow Plane');
            const plane = textActor.shadowPlane;

            planeFolder.add(plane.position, 'z', -20, 5).name('Distance (Z)');
            planeFolder.add(plane.material, 'opacity', 0, 1).name('Opacity');

            if (textActor.shadowUniforms) {
                const fadeFolder = planeFolder.addFolder('Vignette / Fade');
                fadeFolder.add(textActor.shadowUniforms.fadeStart, 'value', 0, 1).name('Fade Start (Radius)');
                fadeFolder.add(textActor.shadowUniforms.fadeEnd, 'value', 0, 1).name('Fade End (Radius)');
                fadeFolder.open();
            }

            planeFolder.open();
        }
    }, 500);

    return gui;
}
