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
import {
  FaDiscord,
  FaPatreon,
  FaPause,
  FaPlay,
  FaYoutube,
  FaTwitch,
  FaGithub,
} from "react-icons/fa";
import ControllerRemapButtons from "~/components/Controls/ControllerRemapButtons";
import { useSession } from "next-auth/react";
import { useEmuWindowSizeStore } from "~/components/EmuWindowSize/useEmuWindowSizeStore";
import { EmuWindowSize } from "~/components/EmuWindowSize/EmuWindowSize";
import { ColorEmulation } from "~/components/GBCColors/ColorEmulation";
import { DPad } from "~/components/Controls/DPad";
import { ABStartSelect } from "~/components/Controls/ABStartSelect";
import { useFileStore } from "~/components/FileStore/useFileStore";
import { TASMovieLoader } from "~/components/TASMovieLoader/TASMovieLoader";

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
};

export default function Home() {
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setInitialized(true);
    }, 3000);
  }, []);
  const [gambatteCreate, setGambatteCreate] =
    useState<(...args: unknown[]) => unknown>();
  const [gambatteLoadBuf, setGambatteLoadBuf] =
    useState<(...args: unknown[]) => unknown>();
  const [gambatteLoadBiosBuf, setGambatteLoadBiosBuf] =
    useState<(...args: unknown[]) => unknown>();
  const [gambatteRunFor, setGambatteRunFor] =
    useState<(...args: unknown[]) => unknown>();
  const { rom, bios } = useFileStore((state) => ({
    rom: state.rom,
    bios: state.bios,
  }));
  const [gbPointer, setGbPointer] = useState<number | undefined>(undefined);
  const [gameHash, setGameHash] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(true);
  const totalSamplesEmitted = useRef(0);
  useControls(initialized, totalSamplesEmitted, gbPointer);
  const { data: sessionData } = useSession();
  const windowSize = useEmuWindowSizeStore((state) => state.windowSize);
  const [actualDevicePixelRatio, setActualDevicePixelRatio] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [volume, setVolume] = useState(0.01);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (!initialized) {
      return;
    }
    const gambatte_revision = Module.cwrap("gambatte_revision", "number");
    console.log(`revision: " ${gambatte_revision() as number}`);
  }, [initialized]);

  useEffect(() => {
    setActualDevicePixelRatio(window.devicePixelRatio);
  }, []);

  useEffect(() => {
    if (!initialized) {
      return;
    }
    setGambatteCreate(() => {
      return Module.cwrap("gambatte_create", "number");
    });
    setGambatteLoadBuf(() => {
      return Module.cwrap("gambatte_loadbuf", "number", [
        "number",
        "number",
        "number",
        "number",
      ]);
    });
    setGambatteLoadBiosBuf(() => {
      return Module.cwrap("gambatte_loadbiosbuf", "number", [
        "number",
        "number",
        "number",
      ]);
    });
    setGambatteRunFor(() => {
      return Module.cwrap("gambatte_runfor", "number", [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
      ]);
    });
  }, [initialized]);

  useEffect(() => {
    if (!gambatteCreate) {
      return;
    }
    const gb = gambatteCreate() as number;
    setGbPointer(gb);
    return () => {
      Module._free(gb);
    };
  }, [gambatteCreate]);

  useEffect(() => {
    if (
      !rom ||
      !bios ||
      !gambatteLoadBuf ||
      !gambatteLoadBiosBuf ||
      !gbPointer
    ) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const romDataUint8 = new Uint8Array(Array.from(JSON.parse(rom)));
    setGameHash((CRC32.buf(romDataUint8) >>> 0).toString(16));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const biosDataUint8 = new Uint8Array(Array.from(JSON.parse(bios)));

    const romDataPointer = Module._malloc(romDataUint8.byteLength);
    Module.HEAPU8.set(romDataUint8, romDataPointer);
    gambatteLoadBuf(gbPointer, romDataPointer, romDataUint8.byteLength, 3);
    Module._free(romDataPointer);

    const biosDataPointer = Module._malloc(romDataUint8.byteLength);
    Module.HEAPU8.set(biosDataUint8, biosDataPointer);
    gambatteLoadBiosBuf(gbPointer, biosDataPointer, biosDataUint8.byteLength);
    Module._free(biosDataPointer);
  }, [
    bios,
    gambatteCreate,
    gambatteLoadBiosBuf,
    gambatteLoadBuf,
    gbPointer,
    rom,
  ]);

  useEffect(() => {
    if (
      !rom ||
      !bios ||
      !canvasRef.current ||
      !gbPointer ||
      !gambatteRunFor ||
      !play
    ) {
      return;
    }

    const screenWidth = 160;
    const screenHeight = 144;
    const outputSampleRate = 48000;
    const maxOutputAudioSamples = 2048;
    const videoBufferPointer = Module._malloc(screenWidth * screenHeight * 4);
    const audioBufferPointer = Module._malloc(maxOutputAudioSamples * 4);
    const samplesEmittedPointer = Module._malloc(4);
    const nativeSamplesEmittedPointer = Module._malloc(4);

    const heap32 = new Int32Array(Module.HEAPU8.buffer);
    const samplesEmittedIndex = samplesEmittedPointer >> 2;
    const nativeSamplesEmittedIndex = nativeSamplesEmittedPointer >> 2;
    const videoBuffer = new Uint8ClampedArray(
      Module.HEAPU8.buffer,
      videoBufferPointer,
      screenWidth * screenHeight * 4,
    );
    const backbuffer = new ImageData(videoBuffer, screenWidth, screenHeight);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const presenterContext = canvasRef.current.getContext("2d")!;

    const audioContext = new AudioContext({ sampleRate: outputSampleRate });

    // reduce volume
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);

    const cyclesPerFrame = 35112;
    const audioScheduleAheadTime = 0.05;

    let time = 0;
    let lastBufferDuration = 0;
    let animationFrame = 0;

    const renderLoop = () => {
      if (
        !(time == 0 || time < audioContext.currentTime + audioScheduleAheadTime)
      ) {
        animationFrame = requestAnimationFrame(renderLoop);
        return;
      }
      heap32[samplesEmittedIndex] = cyclesPerFrame;
      heap32[nativeSamplesEmittedIndex] = 0;
      gambatteRunFor(
        gbPointer,
        videoBufferPointer,
        screenWidth,
        audioBufferPointer,
        samplesEmittedPointer,
        nativeSamplesEmittedPointer,
      );
      const samplesProduced = heap32[samplesEmittedIndex] ?? 0;
      const nativeSamplesProduced = heap32[nativeSamplesEmittedIndex] ?? 0;
      totalSamplesEmitted.current += nativeSamplesProduced;

      // process audio output

      if (samplesProduced > 0) {
        const audioSamples = audioContext.createBuffer(
          2,
          samplesProduced,
          outputSampleRate,
        );
        const pcmSamples = new Float32Array(
          Module.HEAPU8.buffer,
          audioBufferPointer,
          samplesProduced * 2,
        );
        audioSamples.copyToChannel(
          pcmSamples.subarray(0, samplesProduced),
          0,
        );
        audioSamples.copyToChannel(
          pcmSamples.subarray(samplesProduced, samplesProduced * 2),
          1,
        );

        // play audio
        const source = audioContext.createBufferSource();
        source.buffer = audioSamples;
        source.connect(gainNode);
        time =
          time == 0
            ? audioContext.currentTime + audioScheduleAheadTime
            : time + lastBufferDuration;
        lastBufferDuration = source.buffer.duration;
        source.start(time);
      }

      // repeat render loop
      presenterContext.putImageData(backbuffer, 0, 0);
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
      Module._free(nativeSamplesEmittedPointer);
      cancelAnimationFrame(animationFrame);
      void audioContext.close();
      document.removeEventListener("visibilitychange", visibilityChangeHandler);
    };
  }, [rom, bios, gbPointer, gambatteRunFor, volume, play]);

  return (
    <>
      <Head>
        <title>T3Boy</title>
        <meta name="description" content="A GB/GBC Emulator Web Frontend" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-4">
          <div className="absolute top-0 mr-4 mt-4 flex w-full justify-end space-x-4 text-3xl text-white">
            <a href="https://www.patreon.com/TiKevin83Speedruns">
              <FaPatreon />
            </a>
            <a href="https://discord.com/invite/qMChgqkSET">
              <FaDiscord />
            </a>
            <a href="https://www.youtube.com/@TiKevin83">
              <FaYoutube />
            </a>
            <a href="https://www.twitch.tv/tikevin83">
              <FaTwitch />
            </a>
            <a href="https://github.com/TiKevin83/T3Boy">
              <FaGithub />
            </a>
          </div>
          <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
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
                <div className="flex flex-col">
                  <p className="border-b border-solid p-1 text-2xl text-white">
                    {initialized ? "Core Emulator Setup" : "Loading..."}
                  </p>
                  {initialized && (
                    <>
                      <ROMLoader gameHash={gameHash ?? undefined} />
                      <BIOSLoader />
                      <p className="text-white">
                        Click the play button below the game after loading
                      </p>
                      <TASMovieLoader />
                    </>
                  )}
                </div>
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
                {initialized && <ColorEmulation gbPointer={gbPointer} />}
              </div>
            </>
          )}
          <div className="pointer-events-none flex touch-none flex-col items-center gap-2">
            <p className="text-white">{gameHash?.toUpperCase()}</p>
            <div className="flex flex-row">
              <DPad />
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
              <ABStartSelect />
            </div>
            <div className="flex flex-row">
              <label htmlFor="Volume" className="mr-2 text-white">
                Volume
              </label>
              <input
                id="Volume"
                type="range"
                min="0"
                max="1"
                step=".01"
                value={volume}
                onChange={(event) => {
                  setVolume(Number(event.target.value));
                }}
                className="pointer-events-auto touch-auto"
              ></input>
              <button
                onClick={() => {
                  setPlay((currentPlay) => {
                    return !currentPlay;
                  });
                }}
                className="text-md pointer-events-auto ml-4 block touch-auto font-medium text-white"
              >
                {play ? <FaPause /> : <FaPlay />}
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <AuthShowcase />
          </div>
        </div>
      </main>
    </>
  );
}
