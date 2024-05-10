import { useFileStore } from "../FileStore/useFileStore";

interface Props {
  gameHash?: string;
}

export const ROMLoader: React.FC<Props> = ({ gameHash }) => {
  const setRom = useFileStore((state) => state.setRom);
  const handleROMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const romFile = e.target.files?.[0];
    void romFile?.arrayBuffer().then((arrayBuffer) => {
      setRom(JSON.stringify(Array.from(new Uint8Array(arrayBuffer))));
    });
  };

  return (
    <div>
      <label
        className="mt-2 block text-sm font-medium text-white"
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
