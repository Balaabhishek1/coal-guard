import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "./theme-toggle";
import { useThemeStore } from "@/store/theme-store";

describe("ThemeToggle Component", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark", "light");
    useThemeStore.setState({ theme: "dark" });
  });

  it("renders pill variant with Light Mode action text when dark", () => {
    render(<ThemeToggle variant="pill" />);
    expect(screen.getByText("Light Mode")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Switch to Light Theme/i })).toBeInTheDocument();
  });

  it("toggles to Dark Mode label when clicked in pill variant", () => {
    render(<ThemeToggle variant="pill" />);
    const button = screen.getByRole("button", { name: /Switch to Light Theme/i });
    fireEvent.click(button);

    expect(screen.getByText("Dark Mode")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Switch to Dark Theme/i })).toBeInTheDocument();
  });

  it("renders icon variant and toggles theme state on click", () => {
    render(<ThemeToggle variant="icon" />);
    const button = screen.getByRole("button", { name: /Switch to Light Theme/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(useThemeStore.getState().theme).toBe("light");

    fireEvent.click(button);
    expect(useThemeStore.getState().theme).toBe("dark");
  });
});
