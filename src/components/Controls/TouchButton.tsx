import { type GameBoyButton } from "./useControls";
import { useDisplayedButtonsStore } from "./useDisplayedButtonsStore";
import { useTouchButtonsStore } from "./useTouchButtonsStore";

interface Props {
  button: GameBoyButton;
  children: React.ReactNode;
}

export const TouchButton: React.FC<Props> = ({ button, children }) => {
  const { addTouchButton, removeTouchButton } = useTouchButtonsStore(
    (state) => ({
      addTouchButton: state.addTouchButton,
      removeTouchButton: state.removeTouchButton,
    }),
  );
  const { displayedButtons, addDisplayedButton, removeDisplayedButton } =
    useDisplayedButtonsStore((state) => ({
      displayedButtons: state.displayedButtons,
      addDisplayedButton: state.addDisplayedButton,
      removeDisplayedButton: state.removeDisplayedButton,
    }));

  return (
    <button
      className="pointer-events-auto flex h-16 w-16 touch-none select-none items-center justify-center"
      style={{
        backgroundColor: (displayedButtons & button) > 0 ? "blue" : "white",
      }}
      onPointerEnter={() => {
        addTouchButton(button);
        addDisplayedButton(button);
      }}
      onGotPointerCapture={(event) => {
        const targetElement = event.target as HTMLButtonElement;
        targetElement.releasePointerCapture(event.pointerId);
      }}
      onPointerLeave={() => {
        removeTouchButton(button);
        removeDisplayedButton(button);
      }}
    >
      {children}
    </button>
  );
};
