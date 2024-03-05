import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type GameBoyKey } from "./useKeyMappingStore";

interface ControllerMappingState {
  controllerMapping: Record<GameBoyKey, number>;
  setControllerMapping: (key: GameBoyKey, value: number) => void;
  controllerMappingInProgress: GameBoyKey | null;
  setControllerMappingInProgress: (
    mappingInProgress: GameBoyKey | null,
  ) => void;
}

export const useControllerMappingStore = create<ControllerMappingState>()(
  persist(
    (set, get) => ({
      controllerMapping: {
        up: 12,
        down: 13,
        left: 14,
        right: 15,
        a: 1,
        b: 0,
        start: 9,
        select: 8,
        reset: 4,
      },
      setControllerMapping: (key, value) => {
        set({
          controllerMapping: { ...get().controllerMapping, [key]: value },
        });
      },
      controllerMappingInProgress: null,
      setControllerMappingInProgress: (inProgress) => {
        set({ controllerMappingInProgress: inProgress });
      },
    }),
    {
      name: "controller-mapping-storage",
    },
  ),
);
