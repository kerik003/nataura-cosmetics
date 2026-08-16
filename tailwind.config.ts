import type { Config } from "tailwindcss";

// NATAURA.COSMETICS — design tokens
// Primary: deep teal-blue (#0C7E8C), Turquoise accent (#3FD1C7)
// Background: cool near-white (#F6FBFB), Ink: deep teal-navy (#0A3B42)
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0A3B42",
        primary: {
          DEFAULT: "#0C7E8C",
          light: "#3FD1C7",
          dark: "#075964",
        },
        turquoise: "#3FD1C7",
        bg: "#F6FBFB",
        sand: "#FBF9F4",
        line: "#DCEEEF",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-manrope)", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
