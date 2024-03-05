import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WindowSizeState {
  windowSize: number;
  setWindowSize: (newWindowSize: number) => void;
}

export const useEmuWindowSizeStore = create<WindowSizeState>()(
  persist(
    (set) => ({
      windowSize: 1,
      setWindowSize: (newWindowSize) => {
        set({ windowSize: newWindowSize });
      },
    }),
    {
      name: "window-size-storage",
    },
  ),
);
