import { Camera, Quaternion, Vector3, Euler } from "three";

import Keyboard from "./inputHelper";

const canvasElement = document.querySelector("#three-canvas");

const clamp = (min: number, max: number, v: number) => {
    if (v < min) return min;
    if (v > max) return max;
    return v;
};

if (canvasElement === null) {
    throw new Error("Document needs #three-canvas.");
}

let pointerLocked = false;
canvasElement?.addEventListener("click", () => {
    canvasElement.requestPointerLock();
});

canvasElement.addEventListener('pointerlockchange', () => {
    console.log("it change")
});

const UP = new Vector3(0, 1, 0);
const LEFT = new Vector3(-1, 0, 0);
const RIGHT = new Vector3(1, 0, 0);
const FORWARD = new Vector3(0, 0, 1);
const BACKWARD = new Vector3(0, 0, -1);

const _euler = new Euler(0, 0, 0, 'YXZ');
const _vector = new Vector3(0, 0, 0);

const SPEED = 0.1;
const MAX_POLAR_ANGLE = Math.PI / 8;
const MIN_POLAR_ANGLE = -MAX_POLAR_ANGLE;

const setupFPSCharacter = (camera: Camera) => {

    const keyboard = new Keyboard();
    const pointer = { velX: 0.0, velY: 0.0 };

    document.addEventListener("mousemove", (e) => {
        pointer.velX += e.movementX;
        pointer.velY += e.movementY;
    });

    return (dt) => {

        if (keyboard.wDown) {
            console.log(camera.matrix);
            console.log(_vector);
            _vector.setFromMatrixColumn(camera.matrix, 0);
            
            camera.translateOnAxis(BACKWARD, SPEED);
        }

        if (keyboard.sDown) {
            camera.translateOnAxis(FORWARD, SPEED);
        }

        if (keyboard.aDown) {
            camera.translateOnAxis(LEFT, SPEED);
        }

        if (keyboard.dDown) {
            camera.translateOnAxis(RIGHT, SPEED);
        }

        if (pointer.velX !== 0 || pointer.velY !== 0) {
            _euler.setFromQuaternion(camera.quaternion);

            _euler.y -= pointer.velX * 0.002;
            _euler.x -= pointer.velY * 0.002;

            // _euler.x = Math.max(PI2 - MAX_POLAR_ANGLE, Math.min(PI2 - MIN_POLAR_ANGLE, _euler.x));
            _euler.x = clamp(MIN_POLAR_ANGLE, MAX_POLAR_ANGLE, _euler.x);

            camera.quaternion.setFromEuler(_euler);

            pointer.velX = 0;
            pointer.velY = 0;
        }

    };

};

export default setupFPSCharacter;