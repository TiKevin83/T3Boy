import { create } from "zustand";
import { persist } from "zustand/middleware";

export enum GameBoyKey {
  up = "up",
  down = "down",
  left = "left",
  right = "right",
  a = "a",
  b = "b",
  start = "start",
  select = "select",
  reset = "reset",
}

interface KeyMappingState {
  keyMapping: Record<GameBoyKey, string>;
  setKeyMapping: (key: GameBoyKey, value: string) => void;
  keyMappingInProgress: boolean;
  setKeyMappingInProgress: (inProgress: boolean) => void;
}

export const useKeyMappingStore = create<KeyMappingState>()(
  persist(
    (set, get) => ({
      keyMapping: {
        up: "ArrowUp",
        down: "ArrowDown",
        left: "ArrowLeft",
        right: "ArrowRight",
        a: "KeyV",
        b: "KeyC",
        start: "KeyX",
        select: "KeyZ",
        reset: "KeyR",
      },
      setKeyMapping: (key, value) => {
        set({ keyMapping: { ...get().keyMapping, [key]: value } });
      },
      keyMappingInProgress: false,
      setKeyMappingInProgress: (inProgress) => {
        set({ keyMappingInProgress: inProgress });
      },
    }),
    {
      name: "key-mapping-storage",
    },
  ),
);
