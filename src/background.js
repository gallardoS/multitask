import * as THREE from 'three';

export function createBackground(scene) {
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const uniforms = {
        u_time: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
            void main() {
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            precision highp float;
            uniform float u_time;
            uniform vec2 u_resolution;

            vec3 colorA = vec3(233.0/255.0, 67.0/255.0, 63.0/255.0);  // rojo
            vec3 colorB = vec3(205.0/255.0, 226.0/255.0, 73.0/255.0); // amarillo
            vec3 colorC = vec3(66.0/255.0, 204.0/255.0, 104.0/255.0); // verde
            vec3 colorD = vec3(62.0/255.0, 189.0/255.0, 223.0/255.0); // azul

            void main() {
                vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                float time = u_time * 1.0;

                float offsetAX = 0.05 * sin(time + sin(time * 0.3 + 1.0));
                float offsetAY = 0.05 * cos(time + cos(time * 0.2 + 2.0));

                float offsetBX = 0.05 * cos(time + sin(time * 0.4 + 3.0));
                float offsetBY = 0.05 * sin(time + cos(time * 0.5 + 4.0));

                float offsetCX = 0.05 * sin(time + cos(time * 0.6 + 5.0));
                float offsetCY = 0.05 * cos(time + sin(time * 0.3 + 6.0));

                float offsetDX = 0.05 * cos(time + sin(time * 0.2 + 7.0));
                float offsetDY = 0.05 * sin(time + cos(time * 0.4 + 8.0));

                vec2 posA = vec2(0.0 + offsetAX, 1.0 + offsetAY);
                vec2 posB = vec2(1.0 + offsetBX, 0.0 + offsetBY);
                vec2 posC = vec2(0.0 + offsetCX, 0.0 + offsetCY);
                vec2 posD = vec2(1.0 + offsetDX, 1.0 + offsetDY);

                float dA = distance(uv, posA);
                float dB = distance(uv, posB);
                float dC = distance(uv, posC);
                float dD = distance(uv, posD);

                float power = 3.0 + 3.0 * (0.5 + 0.5 * sin(u_time * 0.7 + cos(u_time * 0.3)));

                float influenceA = 1.0 / pow(dA + 0.001, power);
                float influenceB = 1.0 / pow(dB + 0.001, power);
                float influenceC = 1.0 / pow(dC + 0.001, power);
                float influenceD = 1.0 / pow(dD + 0.001, power);

                float total = influenceA + influenceB + influenceC + influenceD;

                vec3 color = (
                    colorA * influenceA +
                    colorB * influenceB +
                    colorC * influenceC +
                    colorD * influenceD
                ) / total;

                gl_FragColor = vec4(color, 1.0);
            }
        `
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    return { camera, uniforms };
}
