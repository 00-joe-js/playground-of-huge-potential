import { Camera, Vector3, Euler, MathUtils, BufferGeometry, LineBasicMaterial, Line, Scene, Raycaster, Event, Layers, Ray, Intersection, Object3D } from "three";

import Keyboard, { MouseInterface } from "./inputHelper";

const canvasElement = document.querySelector("#three-canvas");

const SPEED = 0.4;
const MAX_POLAR_ANGLE = MathUtils.degToRad(40);
const MIN_POLAR_ANGLE = -MAX_POLAR_ANGLE;
const SOLID_LAYER = 7;

const CAN_SPRINT_IN_AIR = true;

const _euler = new Euler(0, 0, 0, 'YXZ');
const _vector = new Vector3(0, 0, 0);

if (canvasElement === null) {
    throw new Error("Document needs #three-canvas.");
}
canvasElement?.addEventListener("click", () => {
    canvasElement.requestPointerLock();
});

let collisionChain = false;

const setupFPSCharacter = (camera: Camera, scene: Scene) => {

    camera.position.y = 30;
    // camera.position.z = 500;

    const getSceneSolidObjects = (() => {
        const testLayers = new Layers();
        testLayers.disableAll();
        testLayers.enable(SOLID_LAYER);
        return () => {
            return scene.children.filter(o => o.layers.test(testLayers));
        };
    })();

    const raycastCheckForSolidObjects = (origin: Vector3, dir: Vector3) => {
        const solidObjects = getSceneSolidObjects();
        const raycaster = new Raycaster(origin, dir);
        raycaster.layers.disableAll();
        raycaster.layers.enable(SOLID_LAYER);
        const rayResults = raycaster.intersectObjects(solidObjects);
        return rayResults;
    };

    const touchesASolid = (moveDirection: Vector3, distance: number, origin: Vector3 = camera.position) => {

        const dir = moveDirection.clone();
        dir.normalize();

        // Distance 
        if (Math.abs(distance) !== distance) {
            dir.multiplyScalar(-1);
            distance = Math.abs(distance);
        }

        const rayResults = raycastCheckForSolidObjects(origin, moveDirection);

        const collision = rayResults.some(result => result.distance < Math.abs(distance + 3));

        if (collision && collisionChain === false) {
            console.log("collide");
            collisionChain = true;
        } else if (!collision && collisionChain) {
            collisionChain = false;
            console.warn("No collision");
            console.groupCollapsed("Details");
            console.log("Ray results:", rayResults);
            console.log("Move", moveDirection);
            console.log("Normal", dir);
            console.groupEnd();
        }

        return collision;

    };

    const moveForward = (distance: number, copyToVector: Vector3) => {
        _vector.setFromMatrixColumn(camera.matrix, 0);
        _vector.crossVectors(camera.up, _vector);
        copyToVector.addScaledVector(_vector, distance);
    };

    const moveRight = (distance: number, copyToVector: Vector3) => {
        _vector.setFromMatrixColumn(camera.matrix, 0);
        _vector.y = 0;
        copyToVector.addScaledVector(_vector, distance);
    };

    const keyboard = new Keyboard();
    const mouse = new MouseInterface();

    const pointer = { velX: 0.0, velY: 0.0 };

    document.addEventListener("mousemove", (e) => {
        pointer.velX += e.movementX;
        pointer.velY += e.movementY;
    });

    let sprinting = false;
    let headBobDelta = 0;

    const material = new LineBasicMaterial({
        color: 0xaaffff
    });
    let lines: Line[] = [];

    // To be called in loop:
    const assignSprinting = (isGrounded: boolean) => {
        if (sprinting === true) return sprinting;

        if (keyboard.ctrlDown === true) {
            if (CAN_SPRINT_IN_AIR || isGrounded) {
                sprinting = true;
                return sprinting;
            }
        }

        if (sprinting === false && keyboard.ctrlDown === true) { // Toggle sprint on with ctrl.
            sprinting = true;
        }
    };

    const checkCancelSprinting = (frameMovement: Vector3) => {
        if (frameMovement.multiply(new Vector3(1, 0, 1)).equals(ZERO_VEC3)) {
            sprinting = false;
        }
    };

    const applyCameraRotation = (mouse: MouseInterface, copyToEuler: Euler) => {
        if (mouse.movement.x !== 0 || mouse.movement.y !== 0) {

            copyToEuler.setFromQuaternion(camera.quaternion);

            copyToEuler.y -= mouse.movement.x * 0.002 * 0.8;
            copyToEuler.x -= mouse.movement.y * 0.002 * 0.8;
            copyToEuler.x = MathUtils.clamp(copyToEuler.x, MIN_POLAR_ANGLE, MAX_POLAR_ANGLE);
            camera.quaternion.setFromEuler(copyToEuler);

            mouse.zeroMovement();
        }
    };

    const getPointAheadOfCamera = () => {
        const forward = new Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        forward.multiplyScalar(60);
        forward.add(camera.position);
        return forward;
    };

    const applyHeadBob = (movementVector: Vector3) => {
        const aheadOfCameraBeforeReposition = getPointAheadOfCamera();
        const vel = movementVector.clone().multiply(new Vector3(1, 0, 1)).length();

        const getWavePoint = () => Math.abs(Math.sin(headBobDelta * 1)) * 0.2;
        const currentWavePoint = getWavePoint();

        if (vel > 0) {
            headBobDelta += .1 + (sprinting ? .05 : 0);
            camera.position.y += getWavePoint() - currentWavePoint;
        } else if (currentWavePoint > .1) {
            headBobDelta += .1 + (sprinting ? .05 : 0);
            const newWavePoint = getWavePoint();
            if (newWavePoint > currentWavePoint) {
                headBobDelta -= .2 + (sprinting ? .05 : 0);
            }
            camera.position.y += getWavePoint() - currentWavePoint;
        }

        camera.lookAt(aheadOfCameraBeforeReposition);
    };

    const drawCrosshair = (dt: number) => {
        const forward = getPointAheadOfCamera();

        const points = [];
        points.push(camera.position);
        points.push(forward);
        points.push(forward.clone().add(camera.up));

        const geometry = new BufferGeometry().setFromPoints(points);
        const newLine = new Line(geometry, material);
        if (sprinting) {
            newLine.material.color = RED;
        } else {
            newLine.material.color = HYPER_BLUE;
        }
        scene.add(newLine);
        lines.push(newLine);

        if (lines.length > 5) {
            scene.remove(lines[0]);
            lines = lines.slice(1);
        }
    };

    const checkIsGrounded = (origin: Vector3 = camera.position) => {

        if (aerialVector.y > 0) {
            // Moving upwards
            // so you're not grounded at this distance right now.
            return { grounded: false, slipping: false, solidSurfacesBelow: [] };
        }

        const solidSurfacesBelow = raycastCheckForSolidObjects(origin, new Vector3(0, -1, 0));

        if (solidSurfacesBelow.length === 0) return { grounded: false, slipping: false, solidSurfacesBelow: [] };

        if (solidSurfacesBelow[0].distance <= 5) {
            const slipping = onSlipperySurface(solidSurfacesBelow);
            return { grounded: true, slipping, solidSurfacesBelow };
        } else {
            return { grounded: false, slipping: false, solidSurfacesBelow };
        }

    };

    const onSlipperySurface = (surfaces: Intersection<Object3D<Event>>[]) => {
        const closestSurface = surfaces[0];
        if (!closestSurface || !closestSurface.face) throw new Error("Calling slippery with no surfaces or there are no faces.");
        const surfaceNormal = closestSurface.face.normal.clone();
        surfaceNormal.applyQuaternion(closestSurface.object.quaternion);
        const dotNormal = surfaceNormal.dot(camera.up);

        if (dotNormal > 0.9) {
            return false;
        } else {
            return true;
        }
    };

    // My math goal right now is to not do this by looping and guessing. 
    // There MUST be a better, more determined way.
    const getSlippingVectorFromSurfaceNormal = (surfaceNormal: Vector3) => {
        let testVectors = [new Vector3(1, 0, 0), new Vector3(0, 0, 1), new Vector3(-1, 0, 0), new Vector3(0, 0, -1), new Vector3(0, 1, 0), new Vector3(0, -1, 0)];
        let slideVector = new Vector3(0, 0, 0);
        let yResults = [];
        let i = 0;

        do {
            const testVector = testVectors[i];
            i++;
            slideVector.crossVectors(surfaceNormal, testVector);
            yResults.push(slideVector.y);
        } while (i < testVectors.length)

        const indexOfBestResult = yResults.reduce((bestResult, result, i) => {
            if (result < bestResult.val) return { index: i, val: result };
            return bestResult;
        }, { index: -1, val: Infinity }).index;

        slideVector.crossVectors(surfaceNormal, testVectors[indexOfBestResult]);
        console.log(yResults);
        console.log(testVectors);
        console.log(slideVector);
        return slideVector;
    };

    let thisFallTotalTime = 0;
    let lastFallingFrameTime = 0;
    let aerialVector = new Vector3(0, 0, 0);

    const fall = (deltaTimeSinceSceneStart: number) => {

        if (lastFallingFrameTime === 0) {
            lastFallingFrameTime = deltaTimeSinceSceneStart;
            thisFallTotalTime = 0;
        } else {
            const additionalFallTime = deltaTimeSinceSceneStart - lastFallingFrameTime;
            thisFallTotalTime += additionalFallTime;
            lastFallingFrameTime = deltaTimeSinceSceneStart;
        }

        aerialVector.add(new Vector3(0, -((thisFallTotalTime / 1000) * 9.8) * 0.003, 0));

        camera.position.add(aerialVector);

    };

    let spacePressed = false;
    const getSpacePress = () => {
        if (spacePressed === false && keyboard.spaceDown) {
            spacePressed = true;
            return true;
        } else if (spacePressed === true && !keyboard.spaceDown) {
            spacePressed = false;
            return false;
        } else {
            return false;
        }
    };

    const applyJumpAndGravity = (isGrounded: boolean, isSlipping: boolean, deltaTimeSinceSceneStart: number) => {
        if (isGrounded) {

            lastFallingFrameTime = 0;
            if (!aerialVector.equals(ZERO_VEC3)) {
                aerialVector.set(0, 0, 0);
            }

            if (!isSlipping) {
                let spaceDown = getSpacePress();
                if (spaceDown) {
                    aerialVector.add(new Vector3(0, 0.4 * (sprinting ? 2 : 1), 0));
                    fall(deltaTimeSinceSceneStart);
                }
            }

        } else {
            fall(deltaTimeSinceSceneStart);
        }
    };

    return (dt: number) => {

        const movementVector = new Vector3(0, 0, 0);

        const initialGroundedCheck = checkIsGrounded();
        const isGrounded = initialGroundedCheck.grounded;
        applyJumpAndGravity(isGrounded, initialGroundedCheck.slipping, dt);
        assignSprinting(isGrounded);

        let speed = SPEED * (sprinting ? 3 : 1);

        if (keyboard.wDown) {
            moveForward(speed, movementVector);
        }
        if (keyboard.sDown) {
            moveForward(-speed, movementVector);
        }
        if (keyboard.aDown) {
            moveRight(-speed, movementVector);
        }
        if (keyboard.dDown) {
            moveRight(speed, movementVector);
        }

        if (!movementVector.equals(ZERO_VEC3)) {

            const groundedInNewPosition = checkIsGrounded(camera.position.clone().add(movementVector));

            if (groundedInNewPosition.grounded === true) {

                if (initialGroundedCheck.grounded === true) {
                    const oldDistaceFromFloor = initialGroundedCheck.solidSurfacesBelow[0].distance;
                    const newDistanceFromFloor = groundedInNewPosition.solidSurfacesBelow[0].distance;

                    const differenceInDistanceFromFloor = oldDistaceFromFloor - newDistanceFromFloor;

                    console.log(differenceInDistanceFromFloor);

                    movementVector.y = differenceInDistanceFromFloor;
                }


                if (groundedInNewPosition.slipping === true) {
                    // Slippery.
                    const closestSurface = groundedInNewPosition.solidSurfacesBelow[0];
                    const face = closestSurface.face;
                    if (!face) {
                        console.log(groundedInNewPosition);
                        const err = new Error("No face. Why?");
                        throw err;
                    }
                    const surfaceNormal = face.normal.clone();
                    surfaceNormal.applyQuaternion(closestSurface.object.quaternion);
                    const slideVector = getSlippingVectorFromSurfaceNormal(surfaceNormal);
                    camera.position.add(slideVector.multiplyScalar(3));
                }
            }

            // if (!movementVector.equals(ZERO_VEC3)) {
            //     console.log(movementVector.clone());
            // }

            const maxSlopeableHeight = camera.position.clone();
            maxSlopeableHeight.add(new Vector3(0, -0.5, 0));
            if (!touchesASolid(movementVector, movementVector.length() * 2, maxSlopeableHeight)) {
                camera.position.add(movementVector);
            } else {
                console.log("yes collision");
                movementVector.multiply(ZERO_VEC3); // This is where the movement vector can be zero'd out.
            }
        }

        applyCameraRotation(mouse, _euler);

        // applyHeadBob(movementVector);

        checkCancelSprinting(movementVector);
        drawCrosshair(dt);

    };

};

export default setupFPSCharacter;