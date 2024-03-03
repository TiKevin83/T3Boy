import { useCallback, useEffect, useState } from "react";
import { api } from "~/utils/api";

declare const Module: {
  cwrap: (
    name: string,
    returnType: string,
    argTypes?: string[],
  ) => (...args: unknown[]) => unknown;
  _malloc: (size: number) => number;
  _free: (pointer: number) => void;
  HEAPU8: Uint8Array;
};

interface Props {
  gbPointer: number | undefined;
  gameHash: string;
}

export const SaveState: React.FC<Props> = ({ gbPointer, gameHash }) => {
  const [saveState, setSaveState] = useState<
    ((...args: unknown[]) => unknown) | null
  >(null);
  const [loadState, setLoadState] = useState<
    ((...args: unknown[]) => unknown) | null
  >(null);
  const [saveStatePointer, setSaveStatePointer] = useState<number | null>(null);
  const existingSaveForGameAndUser = api.saveState.getSaveState.useQuery({
    gameHash,
  });
  const updateSaveForGameAndUser = api.saveState.setSaveState.useMutation();

  useEffect(() => {
    const gambatte_savestate = Module.cwrap("gambatte_savestate", "number", [
      "number",
      "number",
      "number",
      "number",
    ]);
    const gambatte_loadstate = Module.cwrap("gambatte_loadstate", "number", [
      "number",
      "number",
      "number",
    ]);
    setSaveState(() => gambatte_savestate);
    setLoadState(() => gambatte_loadstate);
  }, []);

  const handleSaveState = useCallback(async () => {
    if (!saveState) return;
    const stateSize = saveState(gbPointer, null, null, null) as number;
    const newSaveStatePointer = Module._malloc(stateSize);
    setSaveStatePointer(newSaveStatePointer);
    saveState(gbPointer, null, null, newSaveStatePointer);
    const saveStateUint8Array = Module.HEAPU8.subarray(
      newSaveStatePointer,
      newSaveStatePointer + stateSize,
    );
    await updateSaveForGameAndUser.mutateAsync({
      gameHash,
      saveState: JSON.stringify(Array.from(saveStateUint8Array)),
    });
    void existingSaveForGameAndUser.refetch();
    return () => {
      if (saveStatePointer === null) return;
      Module._free(saveStatePointer);
    };
  }, [
    existingSaveForGameAndUser,
    gameHash,
    gbPointer,
    saveState,
    saveStatePointer,
    updateSaveForGameAndUser,
  ]);

  const handleLoadState = useCallback(() => {
    if (!loadState || !saveState) return;
    if (existingSaveForGameAndUser.data?.state !== undefined) {
      const saveStateData = new Uint8Array(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        Array.from(JSON.parse(existingSaveForGameAndUser.data.state)),
      );
      const stateSize = saveState(gbPointer, null, null, null) as number;
      const newSaveStatePointer = saveStatePointer ?? Module._malloc(stateSize);
      Module.HEAPU8.set(saveStateData, newSaveStatePointer);
      loadState(gbPointer, newSaveStatePointer, stateSize);
      setSaveStatePointer(newSaveStatePointer);
    }
  }, [
    existingSaveForGameAndUser.data?.state,
    gbPointer,
    loadState,
    saveState,
    saveStatePointer,
  ]);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-2xl text-white">Cloud EMU States</p>
      <button
        onClick={handleSaveState}
        className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
      >
        Save
      </button>
      {existingSaveForGameAndUser.data?.state &&
        !updateSaveForGameAndUser.isLoading && (
          <button
            onClick={handleLoadState}
            className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
          >
            Load
          </button>
        )}
    </div>
  );
};
