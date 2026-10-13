import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Светлая тёплая тема: слоновая кость, эспрессо и бронза.
        paper: "#FBF7F0",
        sand: {
          DEFAULT: "#F4EEE4",
          deep: "#EAE1D3",
        },
        ink: "#2A211B",
        // Бронза: единственный цвет действия. Дружит с красным тундуком, шоколадом и зеленью гор.
        bronze: {
          DEFAULT: "#A47148",
          dark: "#8A5C38",
          soft: "#F3E6D8",
        },
        accent: {
          DEFAULT: "#E3A63B",
          100: "#FBF0D9",
          300: "#9A6508",
          400: "#C98A1B",
          500: "#E3A63B",
          600: "#D29426",
        },
        felt: "#C8502F",
        muted: {
          DEFAULT: "#7D7469",
          100: "#5E564C",
          200: "#7D7469",
          300: "#A69D91",
          400: "#C9C1B5",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(70, 50, 20, 0.04), 0 12px 32px rgba(70, 50, 20, 0.07)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        rise: "rise 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
