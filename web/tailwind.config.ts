import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Нейтральный графит: поверхности различаются светлотой, а не рамками.
        ink: {
          DEFAULT: "#0B0B0C",
          900: "#0B0B0C",
          800: "#131315",
          700: "#1A1A1D",
          600: "#232327",
        },
        // Единственный акцент — тёплое шампанское, только для важного.
        accent: {
          DEFAULT: "#E6CFA0",
          100: "#F6EEDD",
          300: "#EEDDB9",
          400: "#E9D4AA",
          500: "#E6CFA0",
          600: "#D9BE86",
          700: "#7D6C48",
        },
        felt: "#D9644A",
        muted: {
          DEFAULT: "#9A9AA2",
          100: "#C9C9CE",
          200: "#9A9AA2",
          300: "#6F6F78",
          400: "#4A4A52",
        },
      },
      fontFamily: {
        sans: ["var(--font-onest)", "system-ui", "sans-serif"],
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
