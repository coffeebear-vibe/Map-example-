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
        primary: "#4B7DBF",
        accent: "#F2A413",
        "accent-hover": "#D97F0A",
        success: "#8FBF78",
        error: "#D93B48",
        bg: "#FAFAF8",
        surface: "#F0EFE9",
        ink: "#1A1A1A",
        muted: "#6B6B6B",
        rule: "#D9D6CC",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
