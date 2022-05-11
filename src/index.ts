import "./style.css";

import { Scene, PerspectiveCamera, MeshLambertMaterial, AmbientLight, DirectionalLight, MeshPhongMaterial, BoxGeometry, Color, MathUtils, ShaderMaterial, Vector3, Euler } from "three";
import { SphereGeometry, MeshBasicMaterial, Mesh, UniformsUtils, ShaderLib, BufferAttribute, SphereBufferGeometry } from "three";

import customPhongVertex from "./shading/customPhongVertex"

/* GLOBALS */
declare global {
    var PI: number;
    var PI2: number;
    var ZERO_VEC3: Vector3;
    var RED: Color;
    var BLUE: Color;
    var HYPER_BLUE: Color;
}
window.PI = Math.PI;
window.PI2 = Math.PI * 2;
window.ZERO_VEC3 = new Vector3(0, 0, 0);
window.RED = new Color(0xff0000);
window.BLUE = new Color(0x0000ff);
window.HYPER_BLUE = new Color(0xaaffff);

import { renderLoop } from "./renderer";
import setupFPSCharacter from "./firstPersonCharacter";

const RESOLUTION = 16 / 9;

const scene = new Scene();
const camera = new PerspectiveCamera(50, RESOLUTION, 1, 1000);
camera.position.z = 20;

const includeInGameLoop = setupFPSCharacter(camera, scene);

// randos.
const randomColor = () => {
    const rChannel = () => MathUtils.randFloat(0, 1);
    const color = new Color(rChannel(), rChannel(), rChannel());
    return color;
};

const createRandos = () => {
    const AMOUNT = 300;
    const DISTANCE = 1.0;

    const gameLoopFns = [];

    for (let i = 0; i < AMOUNT; i++) {
        const sphereG = new SphereBufferGeometry(MathUtils.randFloat(0.5, 2.5), MathUtils.randInt(7, 15), MathUtils.randInt(10, 20));

        let offsets = new Float32Array();
        for (let i = 0; i < sphereG.attributes.position.count; i++) {
            offsets[i] = Math.random();
        }

        sphereG.setAttribute('offset', new BufferAttribute(offsets, 1));

        const tryMaterial = "phong";

        const combinedUniforms = UniformsUtils.merge([
            ShaderLib[tryMaterial].uniforms,
            { specular: { value: randomColor() } },
            { shininess: { value: 2000.0 } },
            { diffuse: { value: randomColor() } },
            { time: { value: 0.0 } },
        ]);

        const customMaterial = new ShaderMaterial({
            uniforms: combinedUniforms,
            vertexShader: customPhongVertex,
            fragmentShader: ShaderLib[tryMaterial].fragmentShader,
            lights: true,
        });

        const sphere = new Mesh(sphereG, customMaterial);

        sphere.position.y = .5;
        sphere.rotation.y = Math.random() * PI;

        const orbitRadius = (i - 5) * -DISTANCE;
        sphere.position.x = orbitRadius * Math.cos(MathUtils.randFloat(0, PI2));
        sphere.position.z = orbitRadius * Math.sin(MathUtils.randFloat(0, PI2));

        scene.add(sphere);

        const initialY = sphere.position.y;
        const offset = MathUtils.randInt(0, 5000);
        const xOffset = MathUtils.randInt(-300, 300);
        const extra = MathUtils.randInt(25, 50);
        const normSin = (sin: number) => (sin + 1) / 2;
        gameLoopFns.push((dt: number) => {
            sphere.position.y = initialY + normSin(Math.sin((offset + dt) / 500));
            sphere.position.x = ((Math.sin((dt + offset) / (offset + 1000))) * extra) + xOffset;
            sphere.position.z += (Math.cos((dt + offset)/2000));
            combinedUniforms.time.value = dt;
        });
    }

    return gameLoopFns;


};

let sceneMade = false;

let loopHooks = [includeInGameLoop];



renderLoop(scene, camera, (dt) => {

    if (sceneMade === false) {
        sceneMade = true;

        loopHooks = loopHooks.concat(...createRandos());

        const u = { uTime: { value: 0.0 } };
        const groundMat = new ShaderMaterial({
            wireframe: true,
            uniforms: u,
            vertexShader: `
            uniform float uTime;
            uniform float uSeed;
            float rand(float n){return fract(sin(n) * 43758.5453123);}
            float noise(float p){
                float fl = floor(p);
                float fc = fract(p);
                return mix(rand(fl), rand(fl + 1.0), fc);
            }
            varying vec3 vPos;
            void main() {
                vec3 pos = position + vec3(0.0, noise(position.x + position.z / 100.0 + (uTime/150.0)) * -10.0, 0.0);
                vPos = pos;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
            }
            `,
            fragmentShader: `
            varying vec3 vPos;
            void main() {
                vec3 color = vec3(0.0 - (vPos.y / 4.0), 0.0 - (vPos.y / 5.0), 0.0);
                gl_FragColor = vec4(color, 1.0);
            }
            `
        });

        loopHooks.push(dt => {
            u.uTime.value = dt;
        })

        const groundG = new BoxGeometry(1000, 0, 1000, 500, 2, 20);
        const ground = new Mesh(groundG, groundMat);

        const rampG = new BoxGeometry(1000, 30, 30, 40, 40, 3);
        const ramp = new Mesh(rampG, groundMat);

        ramp.position.z = -20;
        ramp.position.y = 3;
        ramp.setRotationFromEuler(new Euler(0, 0, PI / 60));
        scene.add(ramp);

        ground.name = "ground";
        ground.layers.enable(7);
        ramp.layers.enable(7);

        ground.position.y = -2;
        scene.add(ground);

        const ambient = new AmbientLight(0xffffff, 0.2);
        scene.add(ambient);

        const directional = new DirectionalLight(0xffff00, 0.1);
        directional.position.y = -1;
        scene.add(directional);

        loopHooks.push(dt => {
            const theta = dt / 100;
            directional.position.y = -1 + ((Math.sin(theta) + 1) / 2) * 2;
            directional.position.x = Math.cos(theta * 0.7);
            directional.position.z = Math.sin(theta * 2);
        });

    }

    loopHooks.forEach(fn => fn(dt));

});