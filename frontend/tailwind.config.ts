import type { Config } from "tailwindcss";
import {heroui} from "@heroui/react";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      typography: ({ theme }) => ({
        sm: {  // This is for small prose class
          css: {
            p: {
              marginBottom: "0rem",
            },
            h1: {
              marginTop: "1rem",
              marginBottom: ".25rem",
              borderBottom: "1px solid grey",
            },
            h2: {
              marginTop: "1rem",
              marginBottom: ".25rem",
              borderBottom: "1px solid grey",
            },
            h3: {
              marginTop: "1rem",
              marginBottom: ".25rem",
              borderBottom: "1px solid grey",
            },
            img: {
              marginTop: ".5rem",
              marginBottom: ".5rem",
            },
            li: {
              p: {
                marginTop: "0rem",
                marginBottom: "0rem",
              },
              img: {
                marginTop: ".1rem",
                marginBottom: ".1rem",
              },
            },
          }
        },
        DEFAULT: { // This is for default prose class
          css: {
            // Override specific Prose styles
            "div[data-youtube-video]": {
              cursor: "move",
              paddingRight: theme("spacing.6"), // Equivalent to `pr-6`
            },
            "div[data-youtube-video] iframe": {
              border: `0.5rem solid ${theme("colors.black")}`,
              display: "block",
              minHeight: "200px",
              minWidth: "200px",
              outline: "0px solid transparent",
            },
            ".ProseMirror-selectednode iframe": {
              outline: `3px solid ${theme("colors.purple.500")}`,
              transition: "outline 0.15s",
            },
          },
        },
      }),
    },
  },
  darkMode: "selector",
  plugins: [heroui(), require('@tailwindcss/typography')],
};
export default config;
