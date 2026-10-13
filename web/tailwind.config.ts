import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Тёплый тёмный фон — войлок и дерево юрты.
        ink: {
          DEFAULT: "#1A130E",
          900: "#1A130E",
          800: "#231A13",
          700: "#2E2219",
          600: "#3A2C20",
        },
        // Акцент — охра орнамента.
        accent: {
          DEFAULT: "#D9A441",
          100: "#F6E7C4",
          300: "#EBC679",
          400: "#E2B55C",
          500: "#D9A441",
          600: "#BC8A2D",
          700: "#946C22",
        },
        felt: "#B4472E",
        muted: {
          DEFAULT: "#B5A898",
          100: "#D6CCBF",
          200: "#B5A898",
          300: "#8E8172",
          400: "#6E6255",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-sm": "0 4px 16px rgba(217, 164, 65, 0.28)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
