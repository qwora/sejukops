import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"] },
      colors: {
        canvas: "#F1F1F1",
        rail: "#EBEBEB",
        surface: "#FFFFFF",
        topbar: "#1A1A1A",
        ink: { DEFAULT: "#1A1A1A", 2: "#303030", muted: "#616161", faint: "#8A8A8A" },
        line: { DEFAULT: "#EBEBEB", strong: "#D4D4D4", input: "#C9C9C9" },
        brand: { DEFAULT: "#0B7A5A", hover: "#075C43", tint: "#E7F7EE", ink: "#0B6E4F", glow: "#3DDC97" },
        ai: { DEFAULT: "#5E35B1", tint: "#FBF8FF", line: "#E2D5FA", ink: "#3D1F7A" },
        warn: { DEFAULT: "#8A5300", tint: "#FFF4E5", line: "#F5D9A8" },
        danger: { DEFAULT: "#B42318", tint: "#FEE4E2" },
        st: {
          "new-bg": "#EEF0F3", "new-fg": "#4A5160",
          "asg-bg": "#E3EEFF", "asg-fg": "#0B4FB3",
          "prog-bg": "#FFF1D6", "prog-fg": "#8A5300",
          "done-bg": "#D9F5E8", "done-fg": "#0B6E4F",
          "rev-bg": "#EFE6FF", "rev-fg": "#5E35B1",
          "cls-bg": "#E9E9E9", "cls-fg": "#4A4A4A"
        }
      },
      boxShadow: {
        card: "0 1px 0 rgba(26,26,26,.07), 0 0 0 1px rgba(26,26,26,.06)",
        btn: "inset 0 -1px 0 #000, inset 0 1px 0 rgba(255,255,255,.18)",
        sec: "0 0 0 1px #D4D4D4, 0 1px 0 rgba(0,0,0,.05)",
        lift: "0 6px 20px rgba(0,0,0,.08)",
        sheet: "0 -6px 24px rgba(0,0,0,.08)",
        cta: "0 6px 16px rgba(11,122,90,.3)"
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        shimmer: { "100%": { transform: "translateX(100%)" } }
      },
      animation: { "fade-up": "fade-up .25s ease-out both" }
    }
  },
  plugins: []
};

export default config;
