class KeyboardInterface {

    wDown: boolean;
    aDown: boolean;
    sDown: boolean;
    dDown: boolean;
    ctrlDown: boolean;

    _listener: ((e: KeyboardEvent) => void) | null;
    _offListener: ((e: KeyboardEvent) => void) | null;

    constructor() {
        this.wDown = false;
        this.aDown = false;
        this.sDown = false;
        this.dDown = false;
        this.ctrlDown = false;

        this._listener = null;
        this._offListener = null;

        this._setupListeners();
    }

    _setupListeners(): void {

        const th: KeyboardInterface = this;

        const { W_KEY_CODE, A_KEY_CODE, S_KEY_CODE, D_KEY_CODE, CTRL_KEY_CODE } = KeyboardInterface;

        const makeListener = (bool: boolean) => {
            return (e: KeyboardEvent) => {
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
    static CTRL_KEY_CODE = "ControlLeft";

}

export default KeyboardInterface;