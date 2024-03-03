import type { Dispatch, SetStateAction } from "react";

interface Props {
  setRomData: Dispatch<SetStateAction<ArrayBuffer | null>>;
  gameHash?: string;
}

export const ROMLoader: React.FC<Props> = ({ setRomData, gameHash }) => {
  const handleROMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const romFile = e.target.files?.[0];
    void romFile?.arrayBuffer().then((arrayBuffer) => {
      setRomData(arrayBuffer);
    });
  };

  return (
    <div>
      <label
        className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
        htmlFor="gameRom"
      >
        Game ROM
        {!!gameHash ? ` - Current Checksum ${gameHash.toUpperCase()}` : null}
      </label>
      <input
        type="file"
        onChange={handleROMChange}
        className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
        id="gameRom"
      />
    </div>
  );
};
