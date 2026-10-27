import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#132238",
        mist: "#f5f7fb",
        sea: "#2864d7",
        mint: "#dff7eb",
        amber: "#fff2d6",
        rose: "#ffe5e5"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(25, 48, 86, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
