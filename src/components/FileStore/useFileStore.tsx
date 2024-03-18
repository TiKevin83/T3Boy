import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FileState {
  bios: string | null;
  setBios: (bios: string | null) => void;
  rom: string | null;
  setRom: (rom: string | null) => void;
  gbiMovie: string | null;
  setGbiMovie: (rom: string | null) => void;
}

export const useFileStore = create<FileState>()(
  persist(
    (set) => ({
      bios: null,
      setBios: (bios) => {
        set({ bios });
      },
      rom: null,
      setRom: (rom) => {
        set({ rom });
      },
      gbiMovie: null,
      setGbiMovie: (gbiMovie) => {
        set({ gbiMovie });
      },
    }),
    {
      name: "file-storage",
    },
  ),
);
