import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#131a4a",
          dark: "#0b2545",
          blue: "#3944BC",
          hover: "#2e3799",
          light: "#eef0fb",
          subtle: "#f4f5fd",
          accent: "#3944BC",
        },
        royal: {
          50: "#eef0fb",
          100: "#e0e3f8",
          200: "#c7ccf2",
          300: "#a1aaeb",
          400: "#747ee1",
          500: "#5058d7",
          600: "#3944bc",
          700: "#2e3799",
          800: "#272e7c",
          900: "#242a63",
          950: "#15183b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        arvo: ["Arvo", "Georgia", "serif"],
        serif: ["Arvo", "Georgia", "serif"],
        display: ["Arvo", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
