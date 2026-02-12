/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // FireSight Brand Colours
        firesight: {
          orange: "#FF6B00",
          gold: "#FFB800",
          yellow: "#FFDD44",
        },
        // Dashboard Colours
        dark: {
          navy: "#1A1A2E",
          charcoal: "#16213E",
          bg: "#0F0F23",
          panel: "#1E1E3A",
        },
      },
      fontFamily: {
        sans: ["Inter", "Helvetica", "Arial", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
