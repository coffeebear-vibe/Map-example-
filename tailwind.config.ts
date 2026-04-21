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
        accent: {
          DEFAULT: "#F2A413",
          hover: "#D97F0A",
          light: "#FEF3D6",
        },
        primary: {
          DEFAULT: "#4B7DBF",
          light: "#EBF2FB",
        },
        success: {
          DEFAULT: "#16A34A",
          light: "#DCFCE7",
        },
        warning: {
          DEFAULT: "#D97706",
          light: "#FEF3C7",
        },
        error: {
          DEFAULT: "#D93B48",
          light: "#FEE2E2",
        },
        border: "#D9D6CC",
        bg: "#FAFAF8",
        surface: "#F0EFE9",
        "text-primary": "#1A1A1A",
        "text-secondary": "#6B6B6B",
      },
      borderRadius: {
        card: "12px",
        input: "8px",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
