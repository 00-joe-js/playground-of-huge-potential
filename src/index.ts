import "./style.css";

import { Scene, PerspectiveCamera, AmbientLight, BoxGeometry, MeshBasicMaterial, MeshLambertMaterial } from "three";
import { Mesh } from "three";

import { renderLoop } from "./renderer";

const RESOLUTION = 16 / 9;

const scene = new Scene();
const camera = new PerspectiveCamera(50, RESOLUTION, 1, 10000);

camera.position.z = 500;
camera.position.y = 5;


let loopHooks: Array<(dt: number) => void> = [];

(async () => {

    let sceneMade = false;

    const initializeScene = (scene: Scene, camera: PerspectiveCamera, dt: number) => {
        sceneMade = true;
        const GROUND_SIZE = 1000;

        const groundG = new BoxGeometry(GROUND_SIZE, 1, GROUND_SIZE, 70, 1, 70);
        const ground = new Mesh(groundG, new MeshLambertMaterial({ color: 0x227700 }));
        scene.add(ground);

        const ambient = new AmbientLight(0xffffff, 1.0);
        scene.add(ambient);

        loopHooks.push((dt) => {
            camera.rotateY(0.001);
            camera.position.y = 20 + (Math.sin(dt / 500) * 10);
            // camera.rotation.x = Math.sin(dt / 500) ;
        })
    };

    renderLoop(scene, camera, (dt) => {

        if (sceneMade === false) {
            initializeScene(scene, camera, dt);
        }

        loopHooks.forEach(fn => fn(dt));

    });

})();


