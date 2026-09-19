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
        /* Google Stitch & Industrial Dark Tokens */
        background: "#051424",
        surface: "#051424",
        "surface-dim": "#051424",
        "surface-bright": "#2c3a4c",
        "surface-container-lowest": "#010f1f",
        "surface-container-low": "#0d1c2d",
        "surface-container": "#122131",
        "surface-container-high": "#1c2b3c",
        "surface-container-highest": "#273647",
        "surface-variant": "#273647",
        
        "on-surface": "#d4e4fa",
        "on-surface-variant": "#bec8d2",
        "inverse-surface": "#d4e4fa",
        "inverse-on-surface": "#233143",
        
        primary: {
          DEFAULT: "#89ceff",
          foreground: "#00344d",
          container: "#0ea5e9",
          "container-foreground": "#003751",
          fixed: "#c9e6ff",
          "fixed-dim": "#89ceff",
        },
        secondary: {
          DEFAULT: "#4edea3",
          foreground: "#003824",
          container: "#00a572",
          "container-foreground": "#00311f",
          fixed: "#6ffbbe",
          "fixed-dim": "#4edea3",
        },
        tertiary: {
          DEFAULT: "#ffb95f",
          foreground: "#472a00",
          container: "#d88a00",
          "container-foreground": "#4a2c00",
          fixed: "#ffddb8",
          "fixed-dim": "#ffb95f",
        },
        error: {
          DEFAULT: "#ffb4ab",
          foreground: "#690005",
          container: "#93000a",
          "container-foreground": "#ffdad6",
        },

        outline: {
          DEFAULT: "#88929b",
          variant: "#3e4850",
        },

        /* Statutory & Telemetry Semantic Tokens */
        statutory: {
          safe: "#10b981",       /* Emerald-500: Statutory Compliant */
          warning: "#f59e0b",    /* Amber-500: Cautionary / Warning */
          critical: "#f43f5e",   /* Rose-500: Critical Breach */
          identity: "#0ea5e9",   /* Sky-500: Identity & Ledger Anchor */
          neutral: "#94a3b8",    /* Slate-400: Passive Metadata */
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        telemetry: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm: "0.125rem",
        md: "0.25rem",
        lg: "0.375rem",
        xl: "0.5rem",
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
