import * as THREE from 'three';

export function createBackground(scene) {
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const uniforms = {
        u_time: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_mouse: { value: new THREE.Vector2(0.5, 0.5) }
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
            void main() {
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

vec3 colorA = vec3(233.0/255.0, 67.0/255.0, 63.0/255.0);
vec3 colorB = vec3(205.0/255.0, 226.0/255.0, 73.0/255.0);
vec3 colorC = vec3(66.0/255.0, 204.0/255.0, 104.0/255.0);
vec3 colorD = vec3(62.0/255.0, 189.0/255.0, 223.0/255.0);

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float time = u_time * 0.5;
    vec2 mouseOffset = (u_mouse / u_resolution.xy) * 2.0 - 1.0;
    mouseOffset *= 0.2;

    float warpSize = (sin(time * 0.3) * 0.05) + 0.05;
    float warpX = sin(time + uv.y * 3.0 + mouseOffset.x * 3.0) * warpSize;
    float warpY = cos(time + uv.x * 3.0 + mouseOffset.y * 3.0) * warpSize;

    uv.x += warpX;
    uv.y += warpY;

    vec3 gradient = mix(colorC, colorB, uv.x);
    gradient = mix(gradient, colorA, uv.y);
    gradient = mix(gradient, colorD, uv.x * uv.y);

    gl_FragColor = vec4(gradient, 1.0);
}`
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    window.addEventListener('mousemove', (event) => {
        uniforms.u_mouse.value.set(event.clientX, window.innerHeight - event.clientY);
    });

    return { camera, uniforms };
}
