import { WebGLRenderer } from "three/src/renderers/WebGLRenderer";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { PixelShader } from "three/examples/jsm/shaders/PixelShader";


import { Scene, Camera, Vector2, Color, Vector3 } from "three";

const canvasElement = document.querySelector("#three-canvas");

if (canvasElement === null) {
    throw new Error("Document needs #three-canvas.");
}

const renderer = new WebGLRenderer({
    canvas: canvasElement,
});

const composer = new EffectComposer(renderer);

renderer.setSize(canvasElement.clientWidth, canvasElement.clientHeight);
composer.setSize(canvasElement.clientWidth, canvasElement.clientHeight);
renderer.setClearColor(0x222200);

export const renderLoop = (scene: Scene, camera: Camera, onLoop: (dt: number) => void) => {

    const screenRes = new Vector2(canvasElement.clientWidth, canvasElement.clientHeight);
    const bloomPass = new UnrealBloomPass(screenRes, 5.0, -0.1, 0.9);

    // const pixelPass = new ShaderPass(PixelShader);
    // pixelPass.uniforms.resolution.value = new Vector2(canvasElement.clientWidth, canvasElement.clientHeight);
    // pixelPass.uniforms.pixelSize.value = 2;
    // composer.addPass(pixelPass);
    // pixelPass.renderToScreen = true;

    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(bloomPass);

    bloomPass.renderToScreen = true;

    const internalLoop = (deltaTime: number) => {
        window.requestAnimationFrame(internalLoop);
        onLoop(deltaTime);
        composer.render(deltaTime);
    };
    window.requestAnimationFrame(internalLoop);

};

export default renderer;