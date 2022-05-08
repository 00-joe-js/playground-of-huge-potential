import { Camera } from "three";

import Keyboard from "./inputHelper";

const setupFPSCharacter = (camera: Camera) => {

    const keyboard = new Keyboard();

    setInterval(() => {
        console.log(keyboard);
    }, 1000);

};

export default setupFPSCharacter;