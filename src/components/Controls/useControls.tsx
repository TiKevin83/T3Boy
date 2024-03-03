import { useCallback, useEffect, useRef, useState } from "react";
import { useKeyMappingStore } from "./useKeyMappingStore";

declare const Module: {
  cwrap: (
    name: string,
    returnType: string | null,
    argTypes: string[],
  ) => (...args: unknown[]) => unknown;
  addFunction: (func: () => number, signature: string) => number;
  _free: (pointer: number) => void;
};

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
        (Number(event.code === keyMapping.a) * 0x01) |
        (Number(event.code === keyMapping.b) * 0x02) |
        (Number(event.code === keyMapping.select) * 0x04) |
        (Number(event.code === keyMapping.start) * 0x08) |
        (Number(event.code === keyMapping.right) * 0x10) |
        (Number(event.code === keyMapping.left) * 0x20) |
        (Number(event.code === keyMapping.up) * 0x40) |
        (Number(event.code === keyMapping.down) * 0x80);
    },
    [
      keyMappingInProgress,
      keyMapping.reset,
      keyMapping.a,
      keyMapping.b,
      keyMapping.select,
      keyMapping.start,
      keyMapping.right,
      keyMapping.left,
      keyMapping.up,
      keyMapping.down,
      gambatteReset,
      gbPointer,
    ],
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
    [
      keyMapping.a,
      keyMapping.b,
      keyMapping.down,
      keyMapping.left,
      keyMapping.right,
      keyMapping.select,
      keyMapping.start,
      keyMapping.up,
    ],
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
    setButtonsFunctionPointer(Module.addFunction(() => buttons.current, "ii"));
    setGambatteReset(() =>
      Module.cwrap("gambatte_reset", null, ["number", "number"]),
    );
    return () => {
      if (buttonsFunctionPointer) {
        Module._free(buttonsFunctionPointer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

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
