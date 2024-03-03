import { useState } from "react";
import { GameBoyKey, useKeyMappingStore } from "./useKeyMappingStore";

const ControlRemapButtons: React.FC = () => {
  const [showKeyMapping, setShowKeyMapping] = useState(false);
  const { keyMapping, setKeyMapping, setKeyMappingInProgress } =
    useKeyMappingStore((state) => ({
      keyMapping: state.keyMapping,
      setKeyMapping: state.setKeyMapping,
      setKeyMappingInProgress: state.setKeyMappingInProgress,
    }));

  const handleRemapClick = (key: GameBoyKey) => {
    setKeyMappingInProgress(true);
    const remapKey = (e: KeyboardEvent) => {
      setKeyMapping(key, e.code);
      buttonBeingRemapped.innerText = `Remap ${key} - currently set to ${e.code}`;
      window.removeEventListener("keydown", remapKey);
      setKeyMappingInProgress(false);
    };
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const buttonBeingRemapped = document.getElementById(`remap-${key}`)!;
    buttonBeingRemapped.innerText = "Press a key";
    window.addEventListener("keydown", remapKey, { once: true });
  };

  return (
    <div>
      <button
        className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
        onClick={() => {
          setShowKeyMapping((currentShowKeyMapping) => {
            return !currentShowKeyMapping;
          });
        }}
      >
        {showKeyMapping ? "Hide Key Mappings" : "Show Key Mappings"}
      </button>
      {showKeyMapping &&
        Object.values(GameBoyKey).map((key) => (
          <button
            key={key}
            id={`remap-${key}`}
            onClick={() => {
              handleRemapClick(key);
            }}
            className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
          >
            Remap {key} - currently set to {keyMapping[key]}
          </button>
        ))}
    </div>
  );
};

export default ControlRemapButtons;
