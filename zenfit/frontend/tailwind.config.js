/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // Every colour resolves through a CSS variable (defined in index.css) so
      // the light/dark switch is a single data-theme attribute, while the
      // `/opacity` modifiers used throughout the UI keep working.
      colors: {
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        surfaceAlt: "rgb(var(--c-surfaceAlt) / <alpha-value>)",
        surfaceHi: "rgb(var(--c-surfaceHi) / <alpha-value>)",
        border: "rgb(var(--c-border) / <alpha-value>)",
        borderSoft: "rgb(var(--c-borderSoft) / <alpha-value>)",
        neon: "rgb(var(--c-neon) / <alpha-value>)",
        neonOn: "rgb(var(--c-neonOn) / <alpha-value>)",
        cyan: "rgb(var(--c-cyan) / <alpha-value>)",
        amber: "rgb(var(--c-amber) / <alpha-value>)",
        rose: "rgb(var(--c-rose) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        faint: "rgb(var(--c-faint) / <alpha-value>)",
      },
      fontFamily: {
        display: ['"Chakra Petch"', "system-ui", "sans-serif"],
        sans: ['"Manrope"', "system-ui", "sans-serif"],
      },
      borderRadius: { xl2: "1.25rem", xl3: "1.75rem" },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "sheet-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.25)", opacity: "0" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.38s cubic-bezier(0.22,1,0.36,1) both",
        "scale-in": "scale-in 0.25s cubic-bezier(0.22,1,0.36,1) both",
        "sheet-up": "sheet-up 0.32s cubic-bezier(0.22,1,0.36,1)",
        shimmer: "shimmer 1.6s infinite",
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.24,0,0.38,1) infinite",
      },
    },
  },
  plugins: [],
};
