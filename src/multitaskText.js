import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

export function createText(scene) {
    return new Promise((resolve) => {
        const loader = new FontLoader();

        loader.load('/fonts/MajorMonoDisplay-Regular.json', function (font) {
            const textGeometry = new TextGeometry('muLTitask', {
                font: font,
                size: 12,
                height: 2,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.3,
                bevelSize: 0.2,
                bevelSegments: 3
            });

            const material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0
            });

            const textMesh = new THREE.Mesh(textGeometry, material);
            textGeometry.center();
            textMesh.scale.set(1, 1, 0.1);
            textMesh.position.set(0, 20, 0);
            scene.add(textMesh);

            let mouseX = 0, mouseY = 0;
            let velocityX = 0, velocityY = 0;
            const friction = 0.5; 

            document.addEventListener('pointermove', (event) => {
                const newMouseX = (event.clientX / window.innerWidth) * 2 - 1;
                const newMouseY = (event.clientY / window.innerHeight) * 2 - 1;
                
                velocityX = newMouseX - mouseX;
                velocityY = newMouseY - mouseY;
                
                mouseX = newMouseX;
                mouseY = newMouseY;
            });

            function animate() {
                const decelerationFactor = 0.3;

                velocityX *= friction;
                velocityY *= friction;

                textMesh.rotation.y += Math.tanh(velocityX) * decelerationFactor;
                textMesh.rotation.x += Math.tanh(velocityY) * decelerationFactor;

                requestAnimationFrame(animate);
            }

            animate();
            resolve(textMesh);
        });
        
    });
}
