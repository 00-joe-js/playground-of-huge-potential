import {GLTFLoader, GLTF} from "three/examples/jsm/loaders/GLTFLoader";
const sweetBabyLoader = new GLTFLoader();

import glitchTower from "../../assets/glitch-tower.glb";

const loadAllModels = () => {
    return new Promise<GLTF[]>((resolvePromise, rejectPromise) => {

        sweetBabyLoader.load(glitchTower, (towerGlb) => {
            resolvePromise([towerGlb]);
        }, () => {}, (err) => {
            rejectPromise(err);
        });

    });
};

export default loadAllModels;