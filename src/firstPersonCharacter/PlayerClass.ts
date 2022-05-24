import { Camera, Vector3 } from "three";

class Player {

    camera: Camera;

    constructor(camera: Camera) {
        this.camera = camera;
    }

    setWorldPosition(pos: Vector3) {
        this.camera.position.z = pos.z;
    }

}

export default Player;