import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light";

interface ThemeState {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const applyThemeToDOM = (theme: ThemeMode) => {
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",

      toggleTheme: () => {
        const nextTheme: ThemeMode = get().theme === "dark" ? "light" : "dark";
        applyThemeToDOM(nextTheme);
        set({ theme: nextTheme });
      },

      setTheme: (theme: ThemeMode) => {
        applyThemeToDOM(theme);
        set({ theme });
      },
    }),
    {
      name: "coalguard-theme-preference",
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDOM(state.theme);
        }
      },
    }
  )
);

// Immediately synchronize with DOM on bundle load
if (typeof window !== "undefined") {
  const rawTheme = localStorage.getItem("coalguard-theme-preference");
  if (rawTheme) {
    try {
      const parsed = JSON.parse(rawTheme);
      if (parsed?.state?.theme === "light") {
        applyThemeToDOM("light");
      } else {
        applyThemeToDOM("dark");
      }
    } catch {
      applyThemeToDOM("dark");
    }
  } else {
    applyThemeToDOM("dark");
  }
}
