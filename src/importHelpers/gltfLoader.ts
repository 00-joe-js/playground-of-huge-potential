import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader";
const sweetBabyLoader = new GLTFLoader();

import glitchTower from "../../assets/glitch-tower.glb";
import towerRamps from "../../assets/glitch-tower-ramps.glb";

const modelUrls = [glitchTower, towerRamps];

const loadOneModel = (url: string) => {
    return new Promise<GLTF>((resolvePromise, rejectPromise) => {
        sweetBabyLoader.load(url, (towerGlb) => {
            resolvePromise(towerGlb);
        }, () => { }, (err) => {
            rejectPromise(err);
        });
    });
};

const loadAllModels = async (): Promise<GLTF[]> => {
    return await Promise.all(modelUrls.map(loadOneModel));
};

export default loadAllModels;