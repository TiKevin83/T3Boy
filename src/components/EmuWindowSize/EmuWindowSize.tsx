import { useEmuWindowSizeStore } from "./useEmuWindowSizeStore";

export const EmuWindowSize: React.FC = () => {
  const { windowSize, setWindowSize } = useEmuWindowSizeStore((state) => ({
    windowSize: state.windowSize,
    setWindowSize: state.setWindowSize,
  }));
  return (
    <div className="flex flex-col">
      <label htmlFor="windowSize" className="text-white">
        Display Scaling
      </label>
      <select
        id="windowSize"
        className="peer block w-full appearance-none border-0 border-b-2 border-gray-200 bg-transparent px-0 py-2.5 text-sm text-gray-500 focus:border-gray-200 focus:outline-none focus:ring-0 dark:border-gray-700 dark:text-gray-400"
        value={windowSize}
        onChange={(event) => {
          setWindowSize(Number(event.target.value));
        }}
      >
        <option value="1">1x</option>
        <option value="2">2x</option>
        <option value="3">3x</option>
        <option value="4">4x</option>
        <option value="6">6x</option>
        <option value="12">12x</option>
        <option value="24">24x</option>
      </select>
    </div>
  );
};
