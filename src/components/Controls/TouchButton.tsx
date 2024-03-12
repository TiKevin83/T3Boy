import { type GameBoyButton } from "./useControls";
import { useDisplayedButtonsStore } from "./useDisplayedButtonsStore";
import { useTouchButtonsStore } from "./useTouchButtonsStore";

interface Props {
  button: GameBoyButton | "reset";
  children: React.ReactNode;
}

export const TouchButton: React.FC<Props> = ({ button, children }) => {
  const { addTouchButton, removeTouchButton, sendTouchReset } =
    useTouchButtonsStore((state) => ({
      addTouchButton: state.addTouchButton,
      removeTouchButton: state.removeTouchButton,
      sendTouchReset: state.sendTouchReset,
    }));
  const { displayedButtons, addDisplayedButton, removeDisplayedButton } =
    useDisplayedButtonsStore((state) => ({
      displayedButtons: state.displayedButtons,
      addDisplayedButton: state.addDisplayedButton,
      removeDisplayedButton: state.removeDisplayedButton,
    }));

  return (
    <button
      className="pointer-events-auto flex h-16 w-16 touch-none select-none items-center justify-center rounded"
      style={{
        backgroundColor:
          button !== "reset" && (displayedButtons & button) > 0
            ? "blue"
            : "white",
      }}
      onPointerEnter={() => {
        if (button === "reset") {
          sendTouchReset();
          return;
        }
        addTouchButton(button);
        addDisplayedButton(button);
      }}
      onGotPointerCapture={(event) => {
        const targetElement = event.target as HTMLButtonElement;
        targetElement.releasePointerCapture(event.pointerId);
      }}
      onPointerLeave={() => {
        if (button === "reset") {
          return;
        }
        removeTouchButton(button);
        removeDisplayedButton(button);
      }}
    >
      {children}
    </button>
  );
};
