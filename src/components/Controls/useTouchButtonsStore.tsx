import { create } from "zustand";
import { type GameBoyButton } from "./useControls";

interface TouchButtonsState {
  touchButtons: number;
  touchReset: boolean;
  addTouchButton: (button: GameBoyButton) => void;
  removeTouchButton: (button: GameBoyButton) => void;
  sendTouchReset: () => void;
  endTouchReset: () => void;
}

export const useTouchButtonsStore = create<TouchButtonsState>((set, get) => ({
  touchButtons: 0,
  touchReset: false,
  addTouchButton: (button) => {
    set({ touchButtons: get().touchButtons | button });
  },
  removeTouchButton: (button) => {
    set({ touchButtons: get().touchButtons & ~button });
  },
  sendTouchReset: () => {
    set({ touchReset: true });
  },
  endTouchReset: () => {
    set({ touchReset: false });
  },
}));
