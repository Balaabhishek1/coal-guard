import { describe, it, expect, beforeEach } from "vitest";
import { useThemeStore } from "./theme-store";

describe("ThemeStore", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark", "light");
    useThemeStore.setState({ theme: "dark" });
  });

  it("initializes with dark theme by default", () => {
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("toggles theme from dark to light and updates DOM class", () => {
    const { toggleTheme } = useThemeStore.getState();
    toggleTheme();

    expect(useThemeStore.getState().theme).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("toggles theme back from light to dark and updates DOM class", () => {
    const { toggleTheme } = useThemeStore.getState();
    toggleTheme(); // to light
    toggleTheme(); // back to dark

    expect(useThemeStore.getState().theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });

  it("allows setting theme directly", () => {
    const { setTheme } = useThemeStore.getState();
    setTheme("light");

    expect(useThemeStore.getState().theme).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);

    setTheme("dark");
    expect(useThemeStore.getState().theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
