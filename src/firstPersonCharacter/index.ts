import { Camera, Quaternion, Vector3, Euler, MathUtils, BufferGeometry, LineBasicMaterial, Line, Scene, Raycaster } from "three";

import Keyboard from "./inputHelper";

const canvasElement = document.querySelector("#three-canvas");

const SOLID_LAYER = 7;

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

const _euler = new Euler(0, 0, 0, 'YXZ');
const _vector = new Vector3(0, 0, 0);

const SPEED = 0.1;
const MAX_POLAR_ANGLE = MathUtils.degToRad(40);
const MIN_POLAR_ANGLE = -MAX_POLAR_ANGLE;

const setupFPSCharacter = (camera: Camera, scene: Scene) => {

    const keyboard = new Keyboard();
    const pointer = { velX: 0.0, velY: 0.0 };

    document.addEventListener("mousemove", (e) => {
        pointer.velX += e.movementX;
        pointer.velY += e.movementY;
    });

    const touchesASolid = () => {

    };

    const moveForward = (distance: number) => {
        _vector.setFromMatrixColumn(camera.matrix, 0);
        _vector.crossVectors(camera.up, _vector);

        const raycaster = new Raycaster(camera.position, _vector);
        raycaster.layers.disableAll();
        raycaster.layers.enable(SOLID_LAYER);

        const objects = scene.children.filter(o => o.layers.test(raycaster.layers));

        const rayResults = raycaster.intersectObjects(objects);

        const collision = rayResults.some(result => result.distance < distance + 0.5);

        if (!collision) {
            camera.position.addScaledVector(_vector, distance);
        }

    };

    const moveRight = (distance: number) => {
        _vector.setFromMatrixColumn(camera.matrix, 0);
        _vector.y = 0;
        camera.position.addScaledVector(_vector, distance);
    };

    let headBobDelta = 0;

    const material = new LineBasicMaterial({
        color: 0xaaffff
    });

    let lines: Line[] = [];

    let sprinting = false;

    return (dt: number) => {

        const initialPosition = camera.position.clone();

        if (sprinting === false && keyboard.ctrlDown === true) {
            sprinting = true;
        } else if (sprinting === true && keyboard.ctrlDown === false) {
            const notMoving = [keyboard.wDown, keyboard.sDown, keyboard.aDown, keyboard.dDown].every(v => v === false);
            if (notMoving) {
                sprinting = false;
            }
        }

        let speed = SPEED * (sprinting ? 3 : 1);

        if (keyboard.wDown) {
            moveForward(speed);
        }
        if (keyboard.sDown) {
            moveForward(-speed);
        }

        if (keyboard.aDown) {
            moveRight(-speed);
        }

        if (keyboard.dDown) {
            moveRight(speed);
        }

        if (pointer.velX !== 0 || pointer.velY !== 0) {
            _euler.setFromQuaternion(camera.quaternion);

            _euler.y -= pointer.velX * 0.002 * 0.8;
            _euler.x -= pointer.velY * 0.002 * 0.8;

            // _euler.x = Math.max(PI2 - MAX_POLAR_ANGLE, Math.min(PI2 - MIN_POLAR_ANGLE, _euler.x));
            _euler.x = clamp(MIN_POLAR_ANGLE, MAX_POLAR_ANGLE, _euler.x);

            camera.quaternion.setFromEuler(_euler);

            pointer.velX = 0;
            pointer.velY = 0;
        }

        const forward = new Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        forward.multiplyScalar(60);
        forward.add(camera.position);

        const movedToPosition = camera.position;
        const posDiff = initialPosition.sub(movedToPosition);
        const vel = Math.abs(posDiff.x) + Math.abs(posDiff.z);

        const getWavePoint = () => Math.abs(Math.sin(headBobDelta * 1)) * 0.2;
        const wavePoint = getWavePoint();

        if (vel > 0) {
            headBobDelta += .1;
            camera.position.y = getWavePoint();
        } else if (wavePoint > .1) {
            headBobDelta += .1;
            const newWavePoint = getWavePoint();
            if (newWavePoint > wavePoint) {
                headBobDelta -= .2;
            }
            camera.position.y = getWavePoint();
        }

        camera.lookAt(forward);

        if (dt % 1000) {
            const points = [];
            points.push(camera.position);
            points.push(forward);
            points.push(forward.clone().add(camera.up));

            const geometry = new BufferGeometry().setFromPoints(points);
            const newLine = new Line(geometry, material);
            scene.add(newLine);
            lines.push(newLine);

            if (lines.length > 5) {
                scene.remove(lines[0]);
                lines = lines.slice(1);
            }

        }

    };

};

export default setupFPSCharacter;