import "./style.css";

import { renderLoop } from "./renderer";
import { Scene, PerspectiveCamera } from "three";

import { SphereGeometry, MeshBasicMaterial, Mesh } from "three";

import setupFPSCharacter from "./firstPersonCharacter";

const RESOLUTION = 16 / 9;

const scene = new Scene();
const camera = new PerspectiveCamera(50, RESOLUTION, 1, 1000);
camera.position.z = 10;

setupFPSCharacter(camera);

let sceneMade = false;
renderLoop(scene, camera, (dt) => {

    if (sceneMade === false) {
        sceneMade = true;
        const sphereG = new SphereGeometry();
        const material = new MeshBasicMaterial({ color: 0x0000ff });
        const sphere = new Mesh(sphereG, material);
        scene.add(sphere);
    }

});