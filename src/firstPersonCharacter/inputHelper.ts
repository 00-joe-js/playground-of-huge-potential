import { Vector2 } from "three";

const CAPTURE_KEY_EVENTS: boolean = false;

class KeyboardInterface {

    wDown: boolean;
    aDown: boolean;
    sDown: boolean;
    dDown: boolean;
    ctrlDown: boolean;
    spaceDown: boolean;

    _listener: ((e: KeyboardEvent) => void) | null;
    _offListener: ((e: KeyboardEvent) => void) | null;

    constructor() {
        this.wDown = false;
        this.aDown = false;
        this.sDown = false;
        this.dDown = false;
        this.ctrlDown = false;
        this.spaceDown = false;

        this._listener = null;
        this._offListener = null;

        this._setupListeners();
    }

    _setupListeners(): void {

        const th: KeyboardInterface = this;

        const { W_KEY_CODE, A_KEY_CODE, S_KEY_CODE, D_KEY_CODE, CTRL_KEY_CODE, SPACE_CODE } = KeyboardInterface;

        const makeListener = (bool: boolean) => {
            return (e: KeyboardEvent) => {
                if (CAPTURE_KEY_EVENTS) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                const kc = e.code;

                switch (kc) {
                    case W_KEY_CODE:
                        this.wDown = bool;
                        break;
                    case S_KEY_CODE:
                        this.sDown = bool;
                        break;
                    case D_KEY_CODE:
                        this.dDown = bool;
                        break;
                    case A_KEY_CODE:
                        this.aDown = bool;
                        break;
                    case CTRL_KEY_CODE:
                        this.ctrlDown = bool;
                        break;
                    case SPACE_CODE:
                        this.spaceDown = bool;
                        break;

                }
            };
        };

        th._listener = makeListener(true);
        th._offListener = makeListener(false);
        document.addEventListener("keydown", th._listener);
        document.addEventListener("keyup", th._offListener);

    }

    destroy(): void {
        if (this._listener && this._offListener) {
            document.removeEventListener("keydown", this._listener);
            document.removeEventListener("keyup", this._offListener);
        }
    }

    static W_KEY_CODE = "KeyW";
    static A_KEY_CODE = "KeyA";
    static S_KEY_CODE = "KeyS";
    static D_KEY_CODE = "KeyD";
    static CTRL_KEY_CODE = "ShiftLeft";
    static SPACE_CODE = "Space";

}

export class MouseInterface {

    movement: Vector2;

    constructor() {
        this.movement = new Vector2();
        document.addEventListener("mousemove", (e) => {
            this.movement.x += e.movementX;
            this.movement.y += e.movementY;
        });
    }

    zeroMovement() {
        this.movement = new Vector2(0, 0);
    }

}

export class GamepadInterface {

    gamepad: Gamepad | null;
    gamepadAvailable: boolean;

    constructor() {
        this.gamepad = null;
        this.gamepadAvailable = false;
        this.listenForGamepadConnect();
    }

    waitForGamepadConnect(timeout = 2000) {

        return new Promise((resolve, reject) => {
            if (this.gamepad) {
                return resolve(this.gamepad);
            }
            const polling = setInterval(() => {
                if (this.gamepad) {
                    resolve(this.gamepad);
                }
            }, 100);
            setTimeout(() => {
                clearInterval(polling);
                resolve(null);
            }, timeout);
        });

    }

    getState() {
        const gamepad = navigator.getGamepads().find(c => !!c);

        if (!gamepad) return null;

        const buttonValues = gamepad.buttons.map(b => b.value);

        const xDown = buttonValues[3] === 1;
        const zRDown = buttonValues[7] === 1;

        const moveScale = 1.5;
        const moveVel = new Vector2(gamepad.axes[0] * moveScale, gamepad.axes[1] * moveScale * -1);

        const lookScale = 40;
        const lookVel = new Vector2(gamepad.axes[2] * lookScale, gamepad.axes[3] * lookScale);
        return { lookVel, moveVel, xDown, zRDown };
    }

    private listenForGamepadConnect() {
        window.addEventListener("gamepadconnected", (e) => {
            this.gamepad = navigator.getGamepads().find(c => !!c) || null;
        });
    }

}


export default KeyboardInterface;

