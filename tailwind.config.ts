// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "selector",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      colors: {
        sky: {
          50:  "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
        },
      },
      boxShadow: {
        "soft":    "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "md-soft": "0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)",
        "lg-soft": "0 8px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)",
        "blue":    "0 0 0 3px rgba(56,189,248,0.18)",
        "blue-sm": "0 0 0 2px rgba(56,189,248,0.15)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("daisyui"),
  ],
  daisyui: {
    themes: [
      {
        grok: {
          "primary":          "#38bdf8",
          "primary-content":  "#ffffff",
          "secondary":        "#f5f7fb",
          "secondary-content":"#4b5563",
          "accent":           "#0ea5e9",
          "accent-content":   "#ffffff",
          "neutral":          "#f5f7fb",
          "neutral-content":  "#0a0a0a",
          "base-100":         "#ffffff",
          "base-200":         "#f5f7fb",
          "base-300":         "#eef0f5",
          "base-content":     "#0a0a0a",
          "info":             "#38bdf8",
          "success":          "#10b981",
          "warning":          "#f59e0b",
          "error":            "#ef4444",
        },
      },
    ],
    darkTheme: false,
    base: true,
    styled: true,
    utils: true,
  },
};

export default config;
