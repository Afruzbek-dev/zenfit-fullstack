/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0B07",
        surface: "#14160F",
        surfaceAlt: "#181B11",
        surfaceHi: "#1E2216",
        border: "#242819",
        borderSoft: "#1D2013",
        neon: "#CCFF00",
        neonOn: "#0A0B07",
        cyan: "#4DFFDF",
        amber: "#FFB020",
        rose: "#FF5C5C",
        ink: "#F4F6EA",
        muted: "#8B9080",
        faint: "#565B49",
      },
      fontFamily: {
        display: ['"Chakra Petch"', "system-ui", "sans-serif"],
        sans: ['"Manrope"', "system-ui", "sans-serif"],
      },
      borderRadius: { xl2: "1.25rem", xl3: "1.75rem" },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { "fade-up": "fade-up 0.3s cubic-bezier(0.22,1,0.36,1) both" },
    },
  },
  plugins: [],
};
