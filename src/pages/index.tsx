import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { AuthShowcase } from "~/components/AuthShowcase/AuthShowcase";
import { ROMLoader } from "~/components/ROMLoader/ROMLoader";
import { BIOSLoader } from "~/components/BIOSLoader/BIOSLoader";
import { useControls } from "~/components/Controls/useControls";
import { SaveState } from "~/components/SaveState/SaveState";
import CRC32 from "crc-32";
import KeyboardRemapButtons from "~/components/Controls/KeyboardRemapButtons";
import { GameSave } from "~/components/GameSave/GameSave";
import { FaPatreon } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";
import { FaTwitch } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";
import ControllerRemapButtons from "~/components/Controls/ControllerRemapButtons";
import { useSession } from "next-auth/react";
import { useEmuWindowSizeStore } from "~/components/EmuWindowSize/useEmuWindowSizeStore";
import { EmuWindowSize } from "~/components/EmuWindowSize/EmuWindowSize";

declare const Module: {
  onRuntimeInitialized: () => void;
  cwrap: (
    name: string,
    returnType: string,
    argTypes?: string[],
  ) => (...args: unknown[]) => unknown;
  _malloc: (size: number) => number;
  _free: (pointer: number) => void;
  HEAPU8: Uint8Array;
  setValue: (pointer: number, value: number, type: string) => void;
  getValue: (pointer: number, type: string) => number;
};

export default function Home() {
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setInitialized(true);
    }, 3000);
  }, []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [romData, setRomData] = useState<ArrayBuffer | null>(null);
  const [biosData, setBiosData] = useState<ArrayBuffer | null>(null);
  const [gbPointer, setGbPointer] = useState<number | undefined>(undefined);
  const [gameHash, setGameHash] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(true);
  useControls(initialized, gbPointer);
  const { data: sessionData } = useSession();
  const windowSize = useEmuWindowSizeStore((state) => state.windowSize);
  const [actualDevicePixelRatio, setActualDevicePixelRatio] = useState(1);

  useEffect(() => {
    if (!initialized) {
      return;
    }
    const gambatte_revision = Module.cwrap("gambatte_revision", "number");
    console.log("revision: " + (gambatte_revision() as number));
  }, [initialized]);

  useEffect(() => {
    setActualDevicePixelRatio(window.devicePixelRatio);
  }, []);

  useEffect(() => {
    if (!romData || !biosData || !canvasRef.current) {
      return;
    }
    const gambatte_create = Module.cwrap("gambatte_create", "number");
    const gambatte_loadbuf = Module.cwrap("gambatte_loadbuf", "number", [
      "number",
      "number",
      "number",
      "number",
    ]);
    const gambatte_loadbiosbuf = Module.cwrap(
      "gambatte_loadbiosbuf",
      "number",
      ["number", "number", "number"],
    );
    const gambatte_runfor = Module.cwrap("gambatte_runfor", "number", [
      "number",
      "number",
      "number",
      "number",
      "number",
    ]);

    const videoBufferPointer = Module._malloc(160 * 144 * 4);
    const audioBufferPointer = Module._malloc((35112 + 2064) * 4);
    const samplesEmittedPointer = Module._malloc(4);

    const romDataUint8 = new Uint8Array(romData);
    setGameHash((CRC32.buf(romDataUint8) >>> 0).toString(16));
    const biosDataUint8 = new Uint8Array(biosData);
    const gb = gambatte_create() as number;
    setGbPointer(gb);

    const romDataPointer = Module._malloc(romData.byteLength);
    Module.HEAPU8.set(romDataUint8, romDataPointer);
    gambatte_loadbuf(gb, romDataPointer, romData.byteLength, 3);
    Module._free(romDataPointer);

    const biosDataPointer = Module._malloc(romData.byteLength);
    Module.HEAPU8.set(biosDataUint8, biosDataPointer);
    gambatte_loadbiosbuf(gb, biosDataPointer, biosData.byteLength);
    Module._free(biosDataPointer);

    const backbuffer = new ImageData(160, 144);

    const renderer = document.createElement("canvas");
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const rendererContext = renderer.getContext("2d")!;
    renderer.width = backbuffer.width;
    renderer.height = backbuffer.height;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const presenterContext = canvasRef.current.getContext("2d")!;

    const sampleRate = 48000;

    const audioContext = new AudioContext({ sampleRate });

    // reduce volume
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.01; // 1 %
    gainNode.connect(audioContext.destination);

    const cyclesPerFrame = 35112;

    let time = 0;
    let lastBufferDuration = 0;
    let animationFrame = 0;

    const renderLoop = () => {
      if (!(audioContext.currentTime - time > 0.001 || time == 0)) {
        animationFrame = requestAnimationFrame(renderLoop);
        return;
      }
      Module.setValue(samplesEmittedPointer, cyclesPerFrame, "i32");
      gambatte_runfor(
        gb,
        videoBufferPointer,
        160,
        audioBufferPointer,
        samplesEmittedPointer,
      );
      const bytesProduced = Module.getValue(samplesEmittedPointer, "i32") * 4;

      // process audio output

      // divide by 2 channels, 2 bytes per 16 bit signed, and 4 to naively resample to 524k
      const audioSamples = audioContext.createBuffer(
        2,
        bytesProduced / 16,
        2097152 / 4,
      );
      const channel1Samples = audioSamples.getChannelData(0);
      const channel2Samples = audioSamples.getChannelData(1);
      for (let sample = 0; sample < channel1Samples.length; sample++) {
        // inverse of the division by 16 when creating the buffer size, same logic
        channel1Samples[sample] =
          Module.getValue(audioBufferPointer + sample * 16, "i16") / 32768.0;
        channel2Samples[sample] =
          Module.getValue(audioBufferPointer + sample * 16 + 2, "i16") /
          32768.0;
      }

      // play audio
      const source = audioContext.createBufferSource();
      source.buffer = audioSamples;
      source.connect(gainNode);
      time =
        time == 0
          ? audioContext.currentTime + 0.003
          : time + lastBufferDuration;
      lastBufferDuration = source.buffer.duration;
      source.start(time);

      // process video output
      for (let i = 0; i < backbuffer.data.length; i += 4) {
        const pixel = Module.getValue(videoBufferPointer + i, "i32");
        backbuffer.data[i + 0] = (pixel >> 16) & 0xff;
        backbuffer.data[i + 1] = (pixel >> 8) & 0xff;
        backbuffer.data[i + 2] = pixel & 0xff;
        backbuffer.data[i + 3] = 0xff;
      }

      // repeat render loop
      rendererContext.putImageData(backbuffer, 0, 0);
      presenterContext.drawImage(renderer, 0, 0);
      animationFrame = requestAnimationFrame(renderLoop);
    };

    const visibilityChangeHandler = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame);
        void audioContext.suspend();
      } else {
        animationFrame = requestAnimationFrame(renderLoop);
        void audioContext.resume();
      }
    };

    document.addEventListener("visibilitychange", visibilityChangeHandler);

    animationFrame = requestAnimationFrame(renderLoop);

    return () => {
      Module._free(videoBufferPointer);
      Module._free(audioBufferPointer);
      Module._free(samplesEmittedPointer);
      cancelAnimationFrame(animationFrame);
      void audioContext.close();
      document.removeEventListener("visibilitychange", visibilityChangeHandler);
    };
  }, [romData, biosData]);

  return (
    <>
      <Head>
        <title>T3Boy</title>
        <meta name="description" content="A GB/GBC Emulator Web Frontend" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] font-mono">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <div className="flex w-full justify-end space-x-4 text-3xl text-white">
            <a href="https://www.patreon.com/TiKevin83Speedruns">
              <FaPatreon />
            </a>
            <a href="https://www.youtube.com/@TiKevin83">
              <FaYoutube />
            </a>
            <a href="https://www.twitch.tv/tikevin83">
              <FaTwitch />
            </a>
            <a href="https://github.com/TiKevin83/gambatte-core">
              <FaGithub />
            </a>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            T3Boy
          </h1>
          <button
            className="block cursor-pointer rounded-lg border border-gray-300 bg-gray-50 px-2 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
            onClick={() => {
              setShowOptions((currentShowOptions) => {
                return !currentShowOptions;
              });
            }}
          >
            {showOptions ? "hide options" : "show options"}
          </button>
          {showOptions && (
            <>
              <div className="flex flex-row space-x-4">
                {initialized && (
                  <>
                    <div className="flex flex-col">
                      <p className="border-b border-solid p-1 text-2xl text-white">
                        Core Emulator Setup
                      </p>
                      <ROMLoader
                        setRomData={setRomData}
                        gameHash={gameHash ?? undefined}
                      />
                      <BIOSLoader setBiosData={setBiosData} />
                    </div>
                  </>
                )}
                {sessionData ? (
                  gameHash &&
                  initialized && (
                    <>
                      <GameSave gbPointer={gbPointer} gameHash={gameHash} />
                      <SaveState gbPointer={gbPointer} gameHash={gameHash} />
                    </>
                  )
                ) : (
                  <div className="flex flex-col">
                    <p className="border-b border-solid p-1 text-2xl text-white">
                      Log In to use Cloud Saving and Savestates
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-row space-x-4">
                <KeyboardRemapButtons />
                <ControllerRemapButtons />
                <EmuWindowSize />
              </div>
            </>
          )}
          <div className="flex flex-col items-center gap-2">
            <p className="text-white">{gameHash?.toUpperCase()}</p>
            <canvas
              ref={canvasRef}
              id="gameboy"
              width={160}
              height={144}
              style={{
                width: `${(windowSize * 160) / actualDevicePixelRatio}px`,
                height: `${(windowSize * 144) / actualDevicePixelRatio}px`,
              }}
            ></canvas>
          </div>
          <div className="flex flex-col items-center gap-2">
            <AuthShowcase />
          </div>
        </div>
      </main>
    </>
  );
}
