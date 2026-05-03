import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "btn-dark":       "#15181d",
        "btn-dark-hover": "#1e2228",
      },
    },
  },
  plugins: [],
};

export default config;
