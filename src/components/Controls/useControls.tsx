import { useCallback, useEffect, useRef, useState } from "react";
import { useKeyMappingStore } from "./useKeyMappingStore";
import { useControllerMappingStore } from "./useControllerMappingStore";
import { useDisplayedButtonsStore } from "./useDisplayedButtonsStore";
import { useTouchButtonsStore } from "./useTouchButtonsStore";

declare const Module: {
  cwrap: (
    name: string,
    returnType: string | null,
    argTypes: string[],
  ) => (...args: unknown[]) => unknown;
  addFunction: (func: () => number, signature: string) => number;
  _free: (pointer: number) => void;
};

export enum GameBoyButton {
  A = 0x01,
  B = 0x02,
  SELECT = 0x04,
  START = 0x08,
  RIGHT = 0x10,
  LEFT = 0x20,
  UP = 0x40,
  DOWN = 0x80,
}

export const useControls = (initialized: boolean, gbPointer?: number) => {
  const [gambatteInputGetter, setGambatteInputGetter] = useState<
    ((...args: unknown[]) => unknown) | null
  >(null);
  const [buttonsFunctionPointer, setButtonsFunctionPointer] = useState<
    number | null
  >(null);
  const [gambatteReset, setGambatteReset] = useState<
    ((...args: unknown[]) => unknown) | null
  >(null);
  const buttons = useRef(0);
  const { addDisplayedButton, removeDisplayedButton } =
    useDisplayedButtonsStore((state) => ({
      addDisplayedButton: state.addDisplayedButton,
      removeDisplayedButton: state.removeDisplayedButton,
    }));
  // Fetch initial state
  const touchButtonsRef = useRef(useTouchButtonsStore.getState().touchButtons);
  // Connect to the store on mount, disconnect on unmount, catch state-changes in a reference
  useEffect(
    () =>
      useTouchButtonsStore.subscribe(
        (state) => (touchButtonsRef.current = state.touchButtons),
      ),
    [],
  );
  const { touchReset, endTouchReset } = useTouchButtonsStore((state) => ({
    touchReset: state.touchReset,
    endTouchReset: state.endTouchReset,
  }));
  const { keyMapping, keyMappingInProgress } = useKeyMappingStore((state) => ({
    keyMapping: state.keyMapping,
    keyMappingInProgress: state.keyMappingInProgress,
  }));
  const { controllerMapping } = useControllerMappingStore((state) => ({
    controllerMapping: state.controllerMapping,
  }));
  const [needToReset, setNeedToReset] = useState(false);

  useEffect(() => {
    if (touchReset && gambatteReset) {
      gambatteReset(gbPointer, 101 * (2 << 14));
      endTouchReset();
    }
  }, [touchReset, endTouchReset, gbPointer, gambatteReset]);

  const keyDownHandler = useCallback(
    (event: KeyboardEvent) => {
      event.preventDefault();
      if (event.repeat || keyMappingInProgress) {
        return;
      }
      if (event.code === keyMapping.reset && gambatteReset) {
        gambatteReset(gbPointer, 101 * (2 << 14));
        return;
      }
      switch (event.code) {
        case keyMapping.a:
          addDisplayedButton(GameBoyButton.A);
          buttons.current |= GameBoyButton.A;
          break;
        case keyMapping.b:
          addDisplayedButton(GameBoyButton.B);
          buttons.current |= GameBoyButton.B;
          break;
        case keyMapping.select:
          addDisplayedButton(GameBoyButton.SELECT);
          buttons.current |= GameBoyButton.SELECT;
          break;
        case keyMapping.start:
          addDisplayedButton(GameBoyButton.START);
          buttons.current |= GameBoyButton.START;
          break;
        case keyMapping.right:
          addDisplayedButton(GameBoyButton.RIGHT);
          buttons.current |= GameBoyButton.RIGHT;
          break;
        case keyMapping.left:
          addDisplayedButton(GameBoyButton.LEFT);
          buttons.current |= GameBoyButton.LEFT;
          break;
        case keyMapping.up:
          addDisplayedButton(GameBoyButton.UP);
          buttons.current |= GameBoyButton.UP;
          break;
        case keyMapping.down:
          addDisplayedButton(GameBoyButton.DOWN);
          buttons.current |= GameBoyButton.DOWN;
          break;
        default:
          break;
      }
    },
    [
      keyMappingInProgress,
      keyMapping,
      gambatteReset,
      gbPointer,
      addDisplayedButton,
    ],
  );

  const keyUpHandler = useCallback(
    (event: KeyboardEvent) => {
      event.preventDefault();
      switch (event.code) {
        case keyMapping.a:
          removeDisplayedButton(GameBoyButton.A);
          buttons.current &= ~GameBoyButton.A;
          break;
        case keyMapping.b:
          removeDisplayedButton(GameBoyButton.B);
          buttons.current &= ~GameBoyButton.B;
          break;
        case keyMapping.select:
          removeDisplayedButton(GameBoyButton.SELECT);
          buttons.current &= ~GameBoyButton.SELECT;
          break;
        case keyMapping.start:
          removeDisplayedButton(GameBoyButton.START);
          buttons.current &= ~GameBoyButton.START;
          break;
        case keyMapping.right:
          removeDisplayedButton(GameBoyButton.RIGHT);
          buttons.current &= ~GameBoyButton.RIGHT;
          break;
        case keyMapping.left:
          removeDisplayedButton(GameBoyButton.LEFT);
          buttons.current &= ~GameBoyButton.LEFT;
          break;
        case keyMapping.up:
          removeDisplayedButton(GameBoyButton.UP);
          buttons.current &= ~GameBoyButton.UP;
          break;
        case keyMapping.down:
          removeDisplayedButton(GameBoyButton.DOWN);
          buttons.current &= ~GameBoyButton.DOWN;
          break;
        default:
          break;
      }
    },
    [keyMapping, removeDisplayedButton],
  );

  useEffect(() => {
    if (!initialized) {
      return;
    }
    setGambatteInputGetter(() =>
      Module.cwrap("gambatte_setinputgetter", "number", [
        "number",
        "number",
        "number",
      ]),
    );
    setGambatteReset(() =>
      Module.cwrap("gambatte_reset", null, ["number", "number"]),
    );
  }, [initialized]);

  const getButtonsFunction = useCallback(() => {
    // modeled from https://github.com/whoisryosuke/react-gamepads
    let controllerButtons = 0;
    // Grab gamepads from browser API
    const detectedGamepads = navigator.getGamepads();

    // Loop through all detected controllers and add if not already in state
    detectedGamepads.forEach((gamepad) => {
      if (gamepad !== null) {
        controllerButtons =
          (Number(gamepad.buttons[controllerMapping.a]?.pressed) *
            GameBoyButton.A) |
          (Number(gamepad.buttons[controllerMapping.b]?.pressed) *
            GameBoyButton.B) |
          (Number(gamepad.buttons[controllerMapping.start]?.pressed) *
            GameBoyButton.START) |
          (Number(gamepad.buttons[controllerMapping.select]?.pressed) *
            GameBoyButton.SELECT) |
          (Number(gamepad.buttons[controllerMapping.up]?.pressed) *
            GameBoyButton.UP) |
          (Number(gamepad.buttons[controllerMapping.down]?.pressed) *
            GameBoyButton.DOWN) |
          (Number(gamepad.buttons[controllerMapping.left]?.pressed) *
            GameBoyButton.LEFT) |
          (Number(gamepad.buttons[controllerMapping.right]?.pressed) *
            GameBoyButton.RIGHT);
        if (
          gambatteReset &&
          gamepad.buttons[controllerMapping.reset]?.pressed
        ) {
          setNeedToReset(true);
        }
      }
    });

    return buttons.current | controllerButtons | touchButtonsRef.current;
  }, [controllerMapping, gambatteReset]);

  useEffect(() => {
    if (gambatteReset && needToReset) {
      gambatteReset(gbPointer, 101 * (2 << 14));
    }
    setNeedToReset(false);
  }, [gambatteReset, gbPointer, needToReset]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    const newButtonsFunctionPointer = Module.addFunction(
      getButtonsFunction,
      "ii",
    );

    setButtonsFunctionPointer(newButtonsFunctionPointer);

    return () => {
      Module._free(newButtonsFunctionPointer);
    };
  }, [initialized, getButtonsFunction]);

  useEffect(() => {
    if (
      gbPointer === undefined ||
      buttonsFunctionPointer === null ||
      gambatteInputGetter === null
    ) {
      return;
    }
    gambatteInputGetter(gbPointer, buttonsFunctionPointer, 0);
  }, [buttonsFunctionPointer, gambatteInputGetter, gbPointer]);

  useEffect(() => {
    window.addEventListener("keydown", keyDownHandler);

    window.addEventListener("keyup", keyUpHandler);

    return () => {
      window.removeEventListener("keydown", keyDownHandler);

      window.removeEventListener("keyup", keyUpHandler);
    };
  }, [keyDownHandler, keyUpHandler]);
};
