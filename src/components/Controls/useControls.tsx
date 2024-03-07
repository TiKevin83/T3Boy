import { useCallback, useEffect, useRef, useState } from "react";
import { useKeyMappingStore } from "./useKeyMappingStore";
import { useControllerMappingStore } from "./useControllerMappingStore";

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
  const { keyMapping, keyMappingInProgress } = useKeyMappingStore((state) => ({
    keyMapping: state.keyMapping,
    keyMappingInProgress: state.keyMappingInProgress,
  }));
  const { controllerMapping } = useControllerMappingStore((state) => ({
    controllerMapping: state.controllerMapping,
  }));
  const [needToReset, setNeedToReset] = useState(false);

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
      buttons.current |=
        (Number(event.code === keyMapping.a) * GameBoyButton.A) |
        (Number(event.code === keyMapping.b) * GameBoyButton.B) |
        (Number(event.code === keyMapping.select) * GameBoyButton.SELECT) |
        (Number(event.code === keyMapping.start) * GameBoyButton.START) |
        (Number(event.code === keyMapping.right) * GameBoyButton.RIGHT) |
        (Number(event.code === keyMapping.left) * GameBoyButton.LEFT) |
        (Number(event.code === keyMapping.up) * GameBoyButton.UP) |
        (Number(event.code === keyMapping.down) * GameBoyButton.DOWN);
    },
    [keyMappingInProgress, keyMapping, gambatteReset, gbPointer],
  );

  const keyUpHandler = useCallback(
    (event: KeyboardEvent) => {
      event.preventDefault();
      buttons.current &=
        (Number(event.code !== keyMapping.a) * 0x01) |
        (Number(event.code !== keyMapping.b) * 0x02) |
        (Number(event.code !== keyMapping.select) * 0x04) |
        (Number(event.code !== keyMapping.start) * 0x08) |
        (Number(event.code !== keyMapping.right) * 0x10) |
        (Number(event.code !== keyMapping.left) * 0x20) |
        (Number(event.code !== keyMapping.up) * 0x40) |
        (Number(event.code !== keyMapping.down) * 0x80);
    },
    [keyMapping],
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

    return buttons.current | controllerButtons;
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
