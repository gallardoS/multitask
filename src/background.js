import * as THREE from 'three';

export function createBackground(scene) {
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const uniforms = {
        u_time: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_state: { value: 0.0 }
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
            uniform float u_state;

            vec3 colorA = vec3(233.0/255.0, 67.0/255.0, 63.0/255.0);  // rojo
            vec3 colorB = vec3(205.0/255.0, 226.0/255.0, 73.0/255.0); // amarillo
            vec3 colorC = vec3(66.0/255.0, 204.0/255.0, 104.0/255.0); // verde
            vec3 colorD = vec3(62.0/255.0, 189.0/255.0, 223.0/255.0); // azul

            void main() {
                vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                float time = u_time * 1.0;

                vec2 waveUV = uv;
                
                waveUV.x += sin(uv.y * 5.0 + time * 0.8) * 0.02;
                waveUV.y += cos(uv.x * 5.0 + time * 0.8) * 0.02;
                
                waveUV.x += sin(uv.y * 11.0 + time * 1.5) * 0.005; 
                waveUV.y += cos(uv.x * 9.0 - time * 1.2) * 0.005;
                
                uv = waveUV; 

                float stateFactor = smoothstep(0.0, 1.0, clamp(u_state, 0.0, 1.0));
                float splitState = smoothstep(1.0, 2.0, clamp(u_state, 1.0, 2.0));
                float greenState = smoothstep(2.0, 3.0, clamp(u_state, 2.0, 3.0));
                float yellowState = smoothstep(3.0, 4.0, clamp(u_state, 3.0, 4.0));

                vec2 posA = vec2(0.25, 0.75);
                vec2 posB = vec2(0.75, 0.25);
                vec2 posC = vec2(0.25, 0.25);
                vec2 posD = vec2(0.75, 0.75);
                
                vec2 wA = vec2(1.0, 1.0);
                vec2 wB = vec2(1.0, 1.0);
                vec2 wC = vec2(1.0, 1.0);
                vec2 wD = vec2(1.0, 1.0);

                vec2 center = vec2(0.5, 0.5);
                posA = mix(posA, center, stateFactor); 
                
                vec2 farBR = vec2(1.5, -0.5);
                vec2 farBL = vec2(-0.5, -0.5);
                vec2 farTR = vec2(1.5, 1.5);
                
                posB = mix(posB, farBR, stateFactor);
                posC = mix(posC, farBL, stateFactor);
                posD = mix(posD, farTR, stateFactor);

                vec2 leftCenter = vec2(0.25, 0.5);
                posA = mix(posA, leftCenter, splitState);
                
                vec2 rightCenter = vec2(0.75, 0.5);
                vec2 farRight = vec2(1.5, 0.5);
                posD = mix(posD, rightCenter, splitState);
                
                vec2 bottomCenter = vec2(0.5, 0.25);
                posC = mix(posC, bottomCenter, greenState);
                
                vec2 bottomRight = vec2(0.75, 0.25);
                posB = mix(posB, bottomRight, yellowState);
                
                vec2 topLeft = vec2(0.25, 0.75);
                posA = mix(posA, topLeft, greenState);
                
                vec2 topRight = vec2(0.75, 0.75);
                posD = mix(posD, topRight, greenState);
                
                vec2 bottomLeft = vec2(0.25, 0.25);
                posC = mix(posC, bottomLeft, yellowState);

                wA = mix(wA, vec2(1.0, 0.2), splitState);
                wD = mix(wD, vec2(1.0, 0.2), splitState);
                
                wA = mix(wA, vec2(1.0, 1.0), greenState);
                wD = mix(wD, vec2(1.0, 1.0), greenState);
                
                wC = mix(wC, vec2(0.2, 1.0), greenState);
                
                wC = mix(wC, vec2(1.0, 1.0), yellowState);

                vec2 wobbleA = vec2(sin(time * 0.5), cos(time * 0.4)) * 0.02;
                vec2 wobbleB = vec2(cos(time * 0.3), sin(time * 0.5)) * 0.02;
                vec2 wobbleC = vec2(sin(time * 0.4), cos(time * 0.6)) * 0.02;
                vec2 wobbleD = vec2(cos(time * 0.6), sin(time * 0.3)) * 0.02;
                
                posA += wobbleA;
                posB += wobbleB;
                posC += wobbleC;
                posD += wobbleD;

                vec2 dA_vec = abs(uv - posA);
                vec2 dB_vec = abs(uv - posB);
                vec2 dC_vec = abs(uv - posC);
                vec2 dD_vec = abs(uv - posD);
                
                float chebyA = max(dA_vec.x * wA.x, dA_vec.y * wA.y);
                float chebyB = max(dB_vec.x * wB.x, dB_vec.y * wB.y);
                float chebyC = max(dC_vec.x * wC.x, dC_vec.y * wC.y);
                float chebyD = max(dD_vec.x * wD.x, dD_vec.y * wD.y);
                
                float mA = chebyA;
                float mB = chebyB;
                float mC = chebyC;
                float mD = chebyD;

                float power = 3.0 + 3.0 * (0.5 + 0.5 * sin(time * 0.5));
                
                float influenceA = 1.0 / pow(mA + 0.001, power);
                float influenceB = 1.0 / pow(mB + 0.001, power);
                float influenceC = 1.0 / pow(mC + 0.001, power);
                float influenceD = 1.0 / pow(mD + 0.001, power);
                
                float isRight = smoothstep(0.3, 0.7, uv.x);
                float isTop   = smoothstep(0.3, 0.7, uv.y);
                float isBottom = 1.0 - isTop;

                float breathe = 0.5 + 0.5 * cos(time * 0.3);
                float BOOST = 2.5 + 1.0 * breathe;

                float baseSuppression = 1.0 - stateFactor;
                
                influenceA *= (1.0 + stateFactor * BOOST);
                
                float st3BlueRevival = splitState * isRight * (1.0 + BOOST);
                
                float st4GreenRevival = greenState * isBottom * (1.0 + BOOST);
                
                float st5YellowRevival = yellowState * isRight * isBottom * (1.0 + BOOST);
                
                float dFactor = (1.0 - stateFactor);
                dFactor += st3BlueRevival;
                
                float st4BlueKill = greenState * isBottom; 
                dFactor *= (1.0 - st4BlueKill);
                influenceD *= dFactor;
                
                float cFactor = (1.0 - stateFactor);
                cFactor += st4GreenRevival;
                
                float st5GreenKill = yellowState * isRight * isBottom;
                cFactor *= (1.0 - st5GreenKill);
                influenceC *= cFactor;
                
                float bFactor = (1.0 - stateFactor);
                bFactor += st5YellowRevival;
                influenceB *= bFactor;
                
                float aSuppressRight = splitState * isRight;
                float aSuppressBottom = greenState * isBottom;
                float aTotalSuppress = clamp(aSuppressRight + aSuppressBottom, 0.0, 1.0);
                influenceA *= (1.0 - aTotalSuppress);

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
