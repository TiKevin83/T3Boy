import { create } from "zustand";
import { type GameBoyButton } from "./useControls";

interface TouchButtonsState {
  touchButtons: number;
  addTouchButton: (button: GameBoyButton) => void;
  removeTouchButton: (button: GameBoyButton) => void;
}

export const useTouchButtonsStore = create<TouchButtonsState>((set, get) => ({
  touchButtons: 0,
  addTouchButton: (button) => {
    set({ touchButtons: get().touchButtons | button });
  },
  removeTouchButton: (button) => {
    set({ touchButtons: get().touchButtons & ~button });
  },
}));
