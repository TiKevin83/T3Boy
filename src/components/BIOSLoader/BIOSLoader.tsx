import type { Dispatch, SetStateAction } from "react";

interface Props {
  setBiosData: Dispatch<SetStateAction<ArrayBuffer | null>>;
}

export const BIOSLoader: React.FC<Props> = ({ setBiosData }) => {
  const handleROMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const biosFile = e.target.files?.[0];
    void biosFile?.arrayBuffer().then((arrayBuffer) => {
      setBiosData(patchBiosForGbcGba(arrayBuffer));
    });
  };

  const patchBiosForGbcGba = (gbcBiosData: ArrayBuffer) => {
    const patchedBios = new Uint8Array(gbcBiosData);
    patchedBios[0xf3] ^= 0x03;
    patchedBios.copyWithin(0xf5, 0xf6, 0xfb);
    patchedBios[0xfb] ^= 0x74;
    return patchedBios.buffer as ArrayBuffer;
  };

  return (
    <div>
      <label
        className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
        htmlFor="gbcBios"
      >
        GBC BIOS
      </label>
      <input
        type="file"
        onChange={handleROMChange}
        className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
        id="gbcBios"
      />
    </div>
  );
};
