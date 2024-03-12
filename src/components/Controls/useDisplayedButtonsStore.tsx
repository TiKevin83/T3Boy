import { create } from "zustand";
import { type GameBoyButton } from "./useControls";

interface DisplayedButtonsState {
  displayedButtons: number;
  addDisplayedButton: (button: GameBoyButton) => void;
  removeDisplayedButton: (button: GameBoyButton) => void;
}

export const useDisplayedButtonsStore = create<DisplayedButtonsState>(
  (set, get) => ({
    displayedButtons: 0,
    addDisplayedButton: (button) => {
      set({ displayedButtons: get().displayedButtons | button });
    },
    removeDisplayedButton: (button) => {
      set({ displayedButtons: get().displayedButtons & ~button });
    },
  }),
);
