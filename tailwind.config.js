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
          small: "0.375rem",
          medium: "0.5rem",
          large: "0.75rem",
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
            background: "#fcfcfd",
            foreground: "#111116",
            primary: {
              DEFAULT: "#ff6b4a",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#d53a81",
              foreground: "#FFFFFF",
            },
            focus: "#ff6b4a",
          },
        },
        dark: {
          colors: {
            background: "#0b0a1d",
            foreground: "#FFFFFF",
            primary: {
              DEFAULT: "#ff6b4a",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#d53a81",
              foreground: "#FFFFFF",
            },
            focus: "#ff6b4a",
            content1: "#161430",
            content2: "#1e1b3d",
            content3: "#26234a",
            content4: "#2e2b57",
          },
        },
      },
    }),
  ],
};
