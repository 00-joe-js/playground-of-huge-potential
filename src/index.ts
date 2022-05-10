import "./style.css";

/* GLOBALS */
declare global {
    var PI: number;
    var PI2: number;
}
window.PI = Math.PI;
window.PI2 = Math.PI * 2;

import { renderLoop } from "./renderer";
import { Scene, PerspectiveCamera, MeshLambertMaterial, AmbientLight, DirectionalLight, MeshPhongMaterial, BoxGeometry, Color, MathUtils, ShaderMaterial, Vector3 } from "three";

import { SphereGeometry, MeshBasicMaterial, Mesh } from "three";

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
    const AMOUNT = 40;
    const DISTANCE = 7.5;

    const gameLoopFns = [];

    for (let i = 0; i < AMOUNT; i++) {
        const sphereG = new SphereGeometry(MathUtils.randFloat(0.5, 2.0), 2, 4);
        const color = randomColor();
        const material = new MeshPhongMaterial({ color, specular: 0x555555 });
        const sphere = new Mesh(sphereG, material);

        sphere.position.y = .5;

        const orbitRadius = (i - 5) * -DISTANCE;
        sphere.position.x = orbitRadius * Math.cos(MathUtils.randFloat(0, PI2));
        sphere.position.z = orbitRadius * Math.sin(MathUtils.randFloat(0, PI2));

        scene.add(sphere);

        const initialY = sphere.position.y;
        const offset = MathUtils.randInt(0, 5000);
        const normSin = (sin: number) => (sin + 1) / 2;
        gameLoopFns.push((dt: number) => {
            sphere.position.y = initialY + normSin(Math.sin((offset + dt) / 500));
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

        const rampG = new BoxGeometry(20, 20, 1, 20, 20, 3);
        const ramp = new Mesh(rampG, groundMat);

        ramp.position.z = -20;
        ramp.position.y = 3;
        scene.add(ramp);

        ramp.layers.enable(7);

        ground.position.y = -2;
        scene.add(ground);

        const ambient = new AmbientLight(0xffffff, 0.2);
        scene.add(ambient);

        const directional = new DirectionalLight(0xffff00, 0.3);
        directional.position.y = -1;
        scene.add(directional);

    }

    loopHooks.forEach(fn => fn(dt));

});