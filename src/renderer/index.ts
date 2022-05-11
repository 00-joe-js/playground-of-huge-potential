import { WebGLRenderer } from "three/src/renderers/WebGLRenderer";

import type { Scene, Camera } from "three";

const canvasElement = document.querySelector("#three-canvas");

if (canvasElement === null) {
    throw new Error("Document needs #three-canvas.");
}

const renderer = new WebGLRenderer({
    canvas: canvasElement,
});

renderer.setSize(canvasElement.clientWidth, canvasElement.clientHeight);
renderer.setClearColor(0xaaaa22a);

export const renderLoop = (scene: Scene, camera: Camera, onLoop: (dt: number) => void) => {

    const internalLoop = (deltaTime: number) => {
        window.requestAnimationFrame(internalLoop);
        onLoop(deltaTime);
        renderer.render(scene, camera);
    };

    window.requestAnimationFrame(internalLoop);
    
};

export default renderer;