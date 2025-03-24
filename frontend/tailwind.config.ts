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
        DEFAULT: {
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
