import "./style.css";

/* GLOBALS */
declare global {
    var PI: number;
    var PI2: number;
}
window.PI = Math.PI;
window.PI2 = Math.PI * 2;

import { renderLoop } from "./renderer";
import { Scene, PerspectiveCamera, MeshLambertMaterial, AmbientLight, DirectionalLight, MeshPhongMaterial } from "three";

import { SphereGeometry, MeshBasicMaterial, Mesh } from "three";

import setupFPSCharacter from "./firstPersonCharacter";

const RESOLUTION = 16 / 9;

const scene = new Scene();
const camera = new PerspectiveCamera(50, RESOLUTION, 1, 1000);
camera.position.z = 10;

const includeInGameLoop = setupFPSCharacter(camera);

let sceneMade = false;
renderLoop(scene, camera, (dt) => {

    if (sceneMade === false) {
        sceneMade = true;
        const sphereG = new SphereGeometry();
        const material = new MeshPhongMaterial({ color: 0x0000ff });
        const sphere = new Mesh(sphereG, material);
        scene.add(sphere);

        scene.add(new AmbientLight(0xffffff, 0.2));

        const directional = new DirectionalLight(0xffff00, 2.5);
        scene.add(directional);


    }

    includeInGameLoop(dt);

});