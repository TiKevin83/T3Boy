import { useEffect, useRef, useState } from "react";
import { useControllerMappingStore } from "./useControllerMappingStore";
import { GameBoyKey } from "./useKeyMappingStore";

const ControllerRemapButtons: React.FC = () => {
  const [showControllerMapping, setShowControllerMapping] = useState(false);
  const {
    controllerMapping,
    setControllerMapping,
    controllerMappingInProgress,
    setControllerMappingInProgress,
  } = useControllerMappingStore((state) => ({
    controllerMapping: state.controllerMapping,
    setControllerMapping: state.setControllerMapping,
    controllerMappingInProgress: state.controllerMappingInProgress,
    setControllerMappingInProgress: state.setControllerMappingInProgress,
  }));
  const animationFrameId = useRef(0);

  useEffect(() => {
    // modeled from https://github.com/whoisryosuke/react-gamepads
    const animate = () => {
      const detectedGamepads = navigator.getGamepads();
      detectedGamepads.forEach((gamepad) => {
        if (gamepad !== null) {
          gamepad.buttons.forEach((button, index) => {
            if (button.pressed && controllerMappingInProgress !== null) {
              setControllerMapping(controllerMappingInProgress, index);
              setControllerMappingInProgress(null);
            }
          });
        }
      });
      animationFrameId.current = requestAnimationFrame(animate);
    };
    if (controllerMappingInProgress !== null) {
      animationFrameId.current = requestAnimationFrame(animate);
    }
    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [
    controllerMappingInProgress,
    setControllerMapping,
    setControllerMappingInProgress,
  ]);

  return (
    <div>
      <button
        className="mt-2 block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
        onClick={() => {
          setShowControllerMapping((currentShowKeyMapping) => {
            return !currentShowKeyMapping;
          });
        }}
      >
        {showControllerMapping
          ? "Hide Controller Mappings"
          : "Show Controller Mappings"}
      </button>
      {showControllerMapping &&
        Object.values(GameBoyKey).map((key) => (
          <button
            key={key}
            id={`remap-${key}`}
            onClick={() => {
              setControllerMappingInProgress(key);
            }}
            className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
          >
            {controllerMappingInProgress === key
              ? `Press a Button`
              : `Remap ${key} - currently set to Button ${controllerMapping[key]}`}
          </button>
        ))}
    </div>
  );
};

export default ControllerRemapButtons;
