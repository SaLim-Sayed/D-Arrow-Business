import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants";

type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "system") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", mode === "dark");
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "light",
      setMode: (mode) => {
        applyTheme(mode);
        set({ mode });
      },
      toggleMode: () =>
        set((state) => {
          const next = state.mode === "light" ? "dark" : "light";
          applyTheme(next);
          return { mode: next };
        }),
    }),
    {
      name: STORAGE_KEYS.THEME,
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.mode);
        }
      },
    }
  )
);
