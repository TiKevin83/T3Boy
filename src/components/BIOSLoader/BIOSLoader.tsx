import { useFileStore } from "../FileStore/useFileStore";

export const BIOSLoader = () => {
  const setBios = useFileStore((state) => state.setBios);
  const handleROMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const biosFile = e.target.files?.[0];
    void biosFile?.arrayBuffer().then((arrayBuffer) => {
      setBios(
        JSON.stringify(
          Array.from(new Uint8Array(patchBiosForGbcGba(arrayBuffer))),
        ),
      );
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
        className="mt-2 block text-sm font-medium text-white"
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
