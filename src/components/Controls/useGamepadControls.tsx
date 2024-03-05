import { useCallback, useEffect, useRef } from "react";

export type GamepadsRecord = Record<number, Gamepad>;

export default function useGamepadControls(
  callback: (data: GamepadsRecord) => void,
) {
  const gamepads = useRef<GamepadsRecord>([]);
  const requestRef = useRef<number>(0);

  const addGamepad = useCallback(
    (gamepad: Gamepad) => {
      gamepads.current = {
        ...gamepads.current,
        [gamepad.index]: gamepad,
      };

      // Send data to external callback (like React state)
      callback(gamepads.current);

      // Handle controller input before render
      // @TODO: Add API to hook callback into this
      // requestAnimationFrame(updateStatus);
    },
    [callback],
  );

  /**
   * Adds game controllers during connection event listener
   * @param {object} e
   */
  const connectGamepadHandler = (e: Event) => {
    addGamepad((e as GamepadEvent).gamepad);
  };

  // Add event listener for gamepad connecting
  useEffect(() => {
    window.addEventListener("gamepadconnected", connectGamepadHandler);

    window.removeEventListener("gamepadconnected", connectGamepadHandler);
  });

  useEffect(() => {
    /**
     * Finds all gamepads and adds them to context
     */
    const scanGamepads = () => {
      // Grab gamepads from browser API
      const detectedGamepads = navigator.getGamepads();

      // Loop through all detected controllers and add if not already in state
      detectedGamepads.forEach((gamepad) => {
        if (gamepad !== null) {
          addGamepad(gamepad);
          gamepad.buttons.forEach((button, index) => {
            button.pressed ? console.log(index) : console.log("");
          });
        }
      });
    };
    const haveEvents = "ongamepadconnected" in window;
    // Update each gamepad's status on each "tick"
    const animate = () => {
      if (!haveEvents) scanGamepads();
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [addGamepad]);

  return gamepads.current;
}
