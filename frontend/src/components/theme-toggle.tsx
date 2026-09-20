import React from "react";
import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/store/theme-store";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "pill";
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  variant = "icon",
}) => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
        title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
        className={`h-7 px-2.5 rounded-full flex items-center gap-1.5 text-xs font-medium transition-all select-none ${
          isDark
            ? "bg-[#181a24] text-zinc-300 hover:text-white hover:bg-[#222536] border border-white/[0.08]"
            : "bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-300/80 shadow-sm"
        } ${className}`}
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px]">Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-[11px]">Dark Mode</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
      title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
      className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all select-none ${
        isDark
          ? "bg-[#181a24] hover:bg-[#202332] text-zinc-400 hover:text-white border border-white/[0.08]"
          : "bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 shadow-sm"
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 transition-transform rotate-0" />
      )}
    </button>
  );
};

export default ThemeToggle;
