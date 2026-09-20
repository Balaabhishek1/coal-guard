/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* CoalGuard Matte Obsidian & Charcoal Slate Design System */
        background: "#0c0d12",
        surface: "#11131a",
        "surface-dim": "#0c0d12",
        "surface-bright": "#1f2330",
        "surface-container-lowest": "#07080b",
        "surface-container-low": "#101218",
        "surface-container": "#151821",
        "surface-container-high": "#1b1e2a",
        "surface-container-highest": "#222635",
        "surface-variant": "#1e2230",
        
        "on-surface": "#f3f4f6",
        "on-surface-variant": "#8e95a5",
        "inverse-surface": "#f3f4f6",
        "inverse-on-surface": "#11131a",
        
        primary: {
          DEFAULT: "#f3f4f6",
          foreground: "#0c0d12",
          container: "#262b3a",
          "container-foreground": "#ffffff",
          fixed: "#e2e8f0",
          "fixed-dim": "#94a3b8",
          accent: "#38bdf8",
        },
        secondary: {
          DEFAULT: "#22c55e",
          foreground: "#0c0d12",
          container: "#166534",
          "container-foreground": "#dcfce7",
          fixed: "#86efac",
          "fixed-dim": "#22c55e",
        },
        tertiary: {
          DEFAULT: "#f59e0b",
          foreground: "#0c0d12",
          container: "#78350f",
          "container-foreground": "#fef3c7",
          fixed: "#fde68a",
          "fixed-dim": "#f59e0b",
        },
        error: {
          DEFAULT: "#f43f5e",
          foreground: "#ffffff",
          container: "#881337",
          "container-foreground": "#ffe4e6",
        },

        outline: {
          DEFAULT: "#272b38",
          variant: "#1c202b",
        },

        /* Calibrated Operations Semantic Tokens */
        statutory: {
          safe: "#22c55e",       /* Emerald-500 */
          warning: "#f59e0b",    /* Amber-500 */
          critical: "#f43f5e",   /* Rose-500 */
          identity: "#38bdf8",   /* Sky-400 */
          neutral: "#71788a",    /* Slate-500 */
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        body: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        telemetry: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      spacing: {
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "0.75rem",
        "space-lg": "1rem",
        "space-xl": "1.5rem",
        "gutter": "0.75rem",
        "gutter-desktop": "1rem",
        "margin": "1rem",
        "margin-desktop": "1.5rem",
      },
      fontSize: {
        "telemetry-micro": ["10px", { lineHeight: "12px", letterSpacing: "0.05em", fontWeight: "500" }],
        "telemetry-sm": ["11px", { lineHeight: "14px", fontWeight: "400" }],
        "telemetry-md": ["14px", { lineHeight: "18px", letterSpacing: "-0.01em", fontWeight: "500" }],
        "telemetry-lg": ["24px", { lineHeight: "28px", letterSpacing: "-0.03em", fontWeight: "600" }],
        "label-sm": ["11px", { lineHeight: "14px", letterSpacing: "0.02em", fontWeight: "500" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.01em", fontWeight: "500" }],
        "body-sm": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "body-md": ["13px", { lineHeight: "18px", fontWeight: "400" }],
        "body-lg": ["15px", { lineHeight: "22px", fontWeight: "400" }],
        "headline-sm": ["15px", { lineHeight: "20px", fontWeight: "600" }],
        "headline-md": ["18px", { lineHeight: "24px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-lg": ["22px", { lineHeight: "28px", letterSpacing: "-0.015em", fontWeight: "600" }],
        "display-lg": ["32px", { lineHeight: "38px", letterSpacing: "-0.02em", fontWeight: "700" }],
      },
    },
  },
  plugins: [],
};
