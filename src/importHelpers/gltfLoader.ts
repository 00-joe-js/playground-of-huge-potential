import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader";
const sweetBabyLoader = new GLTFLoader();

import shovel from "../../assets/shovel.glb";

const modelUrls = [shovel];

const loadOneModel = (url: string) => {
    return new Promise<GLTF>((resolvePromise, rejectPromise) => {
        sweetBabyLoader.load(url, (glb) => {
            resolvePromise(glb);
        }, () => { }, (err) => {
            rejectPromise(err);
        });
    });
};

const loadAllModels = async (): Promise<GLTF[]> => {
    return await Promise.all(modelUrls.map(loadOneModel));
};

export default loadAllModels;