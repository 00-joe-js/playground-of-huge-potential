import "./style.css";

import { Scene, PerspectiveCamera, AmbientLight, BoxGeometry, MeshBasicMaterial, Mesh, Side, FrontSide, SphereGeometry, Vector3, Color, CylinderGeometry, OctahedronGeometry, MeshLambertMaterial, PointLight, MeshPhongMaterial, PointLightHelper, RepeatWrapping, Raycaster, Vector2 } from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import renderer, { renderLoop } from "./renderer";

import { TextureLoader } from "three";
import grassUrl from "../assets/grass.jpg";

import loadAllModels from "./importHelpers/gltfLoader";


const RESOLUTION = 16 / 9;

const scene = new Scene();
const camera = new PerspectiveCamera(50, RESOLUTION, 1, 10000);
const controls = new OrbitControls(camera, renderer.domElement);

camera.position.set(0, 400, 1000);
controls.update();

let loopHooks: Array<(dt: number) => void> = [];

(async () => {

    let sceneMade = false;

    const [shovelGltf] = await loadAllModels();
    const grassTexture = new TextureLoader().load(grassUrl);

    const initializeScene = (scene: Scene, camera: PerspectiveCamera, dt: number) => {
        sceneMade = true;

        // Ground
        const GROUND_SIZE = 1000;
        const groundGeometry = new BoxGeometry(GROUND_SIZE, 1, GROUND_SIZE, 70, 1, 70);
        const groundMesh = new Mesh(groundGeometry, new MeshLambertMaterial({ map: grassTexture }));
        grassTexture.repeat.set(4, 4);
        grassTexture.wrapS = RepeatWrapping;
        grassTexture.wrapT = RepeatWrapping;
        scene.add(groundMesh);

        // Red Ball
        const ballGeometry = new SphereGeometry(30, 20, 10);
        const ballMaterial = new MeshLambertMaterial({ color: 0xff0000 });
        const ballMesh = new Mesh(ballGeometry, ballMaterial);
        ballMesh.position.y = 30;
        ballMesh.position.x = 200;
        ballMesh.position.z = 50;
        scene.add(ballMesh);

        // Sandbox Frame
        const sandBoxWoodGeo = new BoxGeometry(500, 20, 500);
        const sandBoxWood = new Mesh(sandBoxWoodGeo, new MeshLambertMaterial({ color: 0x462300 }));
        sandBoxWood.position.y = 10;
        sandBoxWood.position.x = -150;
        scene.add(sandBoxWood);

        // Sandbox Sand
        const sandBoxSand = sandBoxWood.clone();
        sandBoxSand.receiveShadow = true;
        scene.add(sandBoxSand);
        sandBoxSand.scale.multiply(new Vector3(0.9, 1, 0.9));
        sandBoxSand.position.y += 5;
        sandBoxSand.material = new MeshLambertMaterial({ color: 0xcc8800 });

        // Blue Bucket
        const bucketG = new CylinderGeometry(10, 7, 20);
        const bucket = new Mesh(bucketG, new MeshLambertMaterial({ color: 0x0000ff }));
        bucket.position.copy(sandBoxSand.position);
        bucket.position.y += 25;
        bucket.position.x -= 90;
        bucket.position.z += 100;
        bucket.scale.multiply(new Vector3(1.5, 1.5, 1.5));
        scene.add(bucket);

        // Black Prism
        const prismGeometry = new OctahedronGeometry(10, 0);
        const prism = new Mesh(prismGeometry, new MeshPhongMaterial({ color: 0x000000, shininess: 20 }));
        prism.castShadow = true;
        prism.receiveShadow = true;
        scene.add(prism);
        prism.position.copy(sandBoxWood.position);
        prism.scale.multiplyScalar(4);
        prism.position.y += 80;

        // Shovel
        const shovelMesh = shovelGltf.scene;
        scene.add(shovelMesh);
        shovelMesh.position.copy(sandBoxSand.position);
        shovelMesh.scale.multiplyScalar(5);
        shovelMesh.position.y += 35;
        shovelMesh.position.x += 100;
        shovelMesh.rotateX(-Math.PI / 2 - 0.5);
        shovelMesh.castShadow = true;
        shovelMesh.receiveShadow = true;

        const faerie = new PointLight(0xaaaaaa, 2.0, 1000);
        const helper = new PointLightHelper(faerie, 1);
        scene.add(faerie);
        scene.add(helper);
        faerie.position.y = 150;
        faerie.castShadow = true;
        loopHooks.push(dt => {
            faerie.position.z = 300 * (Math.sin(dt / 500));
            faerie.position.x = 400 * (Math.sin(dt / 700));
        });

        loopHooks.push(dt => {
            prism.rotation.y += 0.05;
        });

        loopHooks.push(dt => {
            controls.update();
        });

        const mousePosition = new Vector2();
        window.addEventListener("pointermove", (e) => {
            mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
            mousePosition.y = - (e.clientY / window.innerHeight) * 2 + 1;
        });

        const rayCaster = new Raycaster();
        loopHooks.push(dt => {
            rayCaster.setFromCamera(mousePosition, camera);
            const mouseOverBucket = rayCaster.intersectObject(bucket);
            console.log(mouseOverBucket);
            if (mouseOverBucket[0]) {
                bucket.rotateZ(1);
            }
        });


    };

    renderLoop(scene, camera, (dt) => {

        if (sceneMade === false) {
            initializeScene(scene, camera, dt);
        }

        loopHooks.forEach(fn => fn(dt));

    });

})();


