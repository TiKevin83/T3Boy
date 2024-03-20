import { create } from "zustand";
import { type GameBoyButton } from "./useControls";

interface DisplayedButtonsState {
  displayedButtons: number;
  setDisplayedButtons: (buttons: number) => void;
  addDisplayedButton: (button: GameBoyButton) => void;
  removeDisplayedButton: (button: GameBoyButton) => void;
}

export const useDisplayedButtonsStore = create<DisplayedButtonsState>(
  (set, get) => ({
    displayedButtons: 0,
    setDisplayedButtons: (buttons) => {
      set({ displayedButtons: buttons });
    },
    addDisplayedButton: (button) => {
      set({ displayedButtons: get().displayedButtons | button });
    },
    removeDisplayedButton: (button) => {
      set({ displayedButtons: get().displayedButtons & ~button });
    },
  }),
);
