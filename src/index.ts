import "./style.css";

import { Scene, PerspectiveCamera, AmbientLight, DirectionalLight, MeshPhongMaterial, BoxGeometry, Color, MathUtils, ShaderMaterial, Vector3, Euler, Group } from "three";
import { Mesh, UniformsUtils, ShaderLib, BufferAttribute, SphereBufferGeometry } from "three";

import customPhongVertex from "./shading/customPhongVertex";

import loadModels from "./importHelpers/gltfLoader";

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
// ---

import { renderLoop } from "./renderer";
import setupFPSCharacter from "./firstPersonCharacter";

const RESOLUTION = 16 / 9;

import Player from "./firstPersonCharacter/PlayerClass";

const scene = new Scene();
const camera = new PerspectiveCamera(50, RESOLUTION, 1, 10000);

const player = new Player(camera);
player.setWorldPosition(new Vector3(0, 0, 4700));

// randos.
const randomColor = () => {
    const rChannel = () => MathUtils.randFloat(0, 1);
    const color = new Color(rChannel(), rChannel(), rChannel());
    return color;
};

const createRandos = () => {
    const AMOUNT = 20;
    const DISTANCE = 1.0;

    const gameLoopFns = [];

    for (let i = 0; i < AMOUNT; i++) {
        const sphereG = new SphereBufferGeometry(MathUtils.randFloat(5.0,8.5), MathUtils.randInt(7, 15), MathUtils.randInt(10, 20));

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
            sphere.position.z += (Math.cos((dt + offset) / 2000));
            combinedUniforms.time.value = dt;
        });
    }

    return gameLoopFns;


};

let sceneMade = false;

let loopHooks: Array<(dt: number) => void> = [];

const configureTower = (towerGroup: Group) => {
    const scale = 400;
    towerGroup.scale.set(scale, scale * 1.2, scale);
    towerGroup.position.z = -500;
    towerGroup.position.y = -10;
    towerGroup.layers.enable(7);
    towerGroup.children.forEach(m => {
        if (!(m instanceof Mesh)) {
            throw new Error("Not a mesh.");
        }
        if (m.name === "Obelisk") {
            m.material = new MeshPhongMaterial({ color: 0x000000, specular: 0xffffff });
        } else {
            m.material = new MeshPhongMaterial({ color: 0xffff00, specular: 0xffffff });
        }
        m.layers.enable(7);
    });
};

(async () => {

    const models = await loadModels();
    loopHooks.push(await setupFPSCharacter(camera, scene));

    renderLoop(scene, camera, (dt) => {

        if (sceneMade === false) {
            sceneMade = true;

            loopHooks = loopHooks.concat(...createRandos());

            const tower = models[0].scene;
            configureTower(tower);
            scene.add(tower);

            const ramps = models[1].scene;
            ramps.scale.set(400, 400, 400);
            ramps.position.z = -500;
            ramps.position.y = 0;
            ramps.layers.enable(7);
            ramps.children.forEach(m => m.layers.enable(7));
            scene.add(ramps);

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
                    vec3 pos = position + vec3(0.0, noise((position.x / 200.0) + (position.z) + (uTime / 1500.0)) * -60.0, (sin(uTime) / 2000.0));
                    vPos = pos;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
                }
                `,
                fragmentShader: `
                uniform float uTime;
                varying vec3 vPos;
                void main() {
                    vec3 color = vec3(0.0 + (abs(vPos.y) / 50.0), sin(vPos.z / 100.0 + (uTime / 200.0)), abs(sin(vPos.y)));
                    gl_FragColor = vec4(color, 1.0);
                }
                `
            });

            loopHooks.push(dt => {
                u.uTime.value = dt;
            })

            const GROUND_SIZE = 10000;

            const groundG = new BoxGeometry(GROUND_SIZE, 0, GROUND_SIZE, 70, 1, 70);
            const ground = new Mesh(groundG, groundMat);
            const rampG = new BoxGeometry(1000, 30, 30, 40, 40, 3);
            const ramp = new Mesh(rampG, new MeshPhongMaterial({ color: 0xaaaaaa }));

            ramp.position.z = -30;
            ramp.position.x = 100;
            ramp.position.y = 3;
            ramp.setRotationFromEuler(new Euler(0, 0, Math.PI / 6));
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
                const theta = dt / 300;
                directional.position.y = -1 + ((Math.sin(theta) + 1) / 2) * 2;
                directional.position.x = Math.cos(theta * 0.7);
                directional.position.z = Math.sin(theta * 2);
            });

        }

        loopHooks.forEach(fn => fn(dt));

    });

})();


