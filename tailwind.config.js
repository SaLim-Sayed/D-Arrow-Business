import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      // Colors are handled by heroui plugin themes below
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      layout: {
        radius: {
          small: "0.5rem",
          medium: "1rem",
          large: "1.5rem",
        },
        borderWidth: {
          small: "1px",
          medium: "1px",
          large: "2px",
        },
      },
      themes: {
        light: {
          colors: {
            background: "#F8F9FB",
            foreground: "#11181C",
            primary: {
              DEFAULT: "#6366F1",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#2DD4BF",
              foreground: "#FFFFFF",
            },
            focus: "#6366F1",
          },
        },
        dark: {
          colors: {
            background: "#0D0D12",
            foreground: "#ECEDEE",
            primary: {
              DEFAULT: "#818CF8",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#5EEAD4",
              foreground: "#000000",
            },
            focus: "#818CF8",
            content1: "#16161D",
            content2: "#1C1C24",
            content3: "#24242D",
            content4: "#2C2C35",
          },
        },
      },
    }),
  ],
};
