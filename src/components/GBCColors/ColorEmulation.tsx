import { useEffect, useState } from "react";

declare const Module: {
  cwrap: (
    name: string,
    returnType: null,
    argTypes?: string[],
  ) => (...args: unknown[]) => unknown;
  _malloc: (size: number) => number;
  _free: (pointer: number) => void;
  setValue: (pointer: number, value: number, type: string) => void;
  HEAPU8: Uint8Array;
};

interface Props {
  gbPointer?: number;
}

export const ColorEmulation: React.FC<Props> = ({ gbPointer }) => {
  const [gbcColorsChecked, setGbcColorsChecked] = useState(false);
  const [gambatteSetCgbPalette, setGambatteSetCgbPalette] = useState<
    ((...args: unknown[]) => unknown) | null
  >(null);

  useEffect(() => {
    const gambatte_setcgbpalette = Module.cwrap(
      "gambatte_setcgbpalette",
      null,
      ["number", "number"],
    );
    setGambatteSetCgbPalette(() => gambatte_setcgbpalette);
  }, []);

  useEffect(() => {
    const cgbLutPointer = Module._malloc(0x8000 * 4);
    const trueColorLutPointer = Module._malloc(0x8000 * 4);
    if (gbPointer && gambatteSetCgbPalette) {
      const trueColor = (r: number, g: number, b: number) => {
        const outputR = (r * 0xff + 0xf) / 0x1f;
        const outputG = (g * 0xff + 0xf) / 0x1f;
        const outputB = (b * 0xff + 0xf) / 0x1f;
        return (0xff << 24) | (outputR << 16) | (outputG << 8) | outputB;
      };
      const cgbColorCurve = [
        0, 6, 12, 20, 28, 36, 45, 56, 66, 76, 88, 100, 113, 125, 137, 149, 161,
        172, 182, 192, 202, 210, 218, 225, 232, 238, 243, 247, 250, 252, 254,
        255,
      ];
      const gamma = 2.2;
      const gbcColor = (r: number, g: number, b: number) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const outputR = cgbColorCurve[r]!;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        let outputG = cgbColorCurve[g]!;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const outputB = cgbColorCurve[b]!;

        if (outputG != outputB) {
          outputG = Math.round(
            Math.pow(
              (Math.pow(outputG / 255.0, gamma) * 3 +
                Math.pow(outputB / 255.0, gamma)) /
                4,
              1 / gamma,
            ) * 255,
          );
        }

        return (0xff << 24) | (outputR << 16) | (outputG << 8) | outputB;
      };
      for (let i = 0; i < 0x8000; i++) {
        const r = i & 0x1f;
        const g = (i >> 5) & 0x1f;
        const b = (i >> 10) & 0x1f;
        Module.setValue(trueColorLutPointer + i * 4, trueColor(r, g, b), "i32");
        Module.setValue(cgbLutPointer + i * 4, gbcColor(r, g, b), "i32");
      }
      if (gbcColorsChecked) {
        gambatteSetCgbPalette(gbPointer, cgbLutPointer);
      } else {
        gambatteSetCgbPalette(gbPointer, trueColorLutPointer);
      }
    }
    return () => {
      Module._free(cgbLutPointer);
      Module._free(trueColorLutPointer);
    };
  }, [gambatteSetCgbPalette, gbPointer, gbcColorsChecked]);

  return (
    <div className="flex flex-col">
      <label htmlFor="gbcColors" className="text-white">
        Emulate GBC Colors
      </label>
      <input
        type="checkbox"
        checked={gbcColorsChecked}
        onChange={() => {
          setGbcColorsChecked((oldChecked) => !oldChecked);
        }}
      ></input>
    </div>
  );
};
