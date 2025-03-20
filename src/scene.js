import * as THREE from 'three';

export function createScene() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 50; // Define el área visible en la cámara

    const scene = new THREE.Scene();
    
    const camera = new THREE.OrthographicCamera(
        -frustumSize * aspect, 
        frustumSize * aspect, 
        frustumSize, 
        -frustumSize, 
        1, 
        1000
    );

    camera.position.set(0, 0, 100); // Aleja la cámara para ver el texto desde el frente

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 5, 500);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    return { scene, camera, frustumSize };
}
