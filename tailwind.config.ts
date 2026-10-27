import type { Config } from "tailwindcss";

/**
 * Sejuk Sejuk design tokens.
 * Brand colours come from the logo: navy, steel blue, frost silver.
 * Status colours are fixed per workflow stage and used the same way everywhere.
 */
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"] },
      colors: {
        canvas: "#F2F5F7",
        rail: "#E8EDF1",
        surface: "#FFFFFF",
        topbar: "#01202F",
        navy: { DEFAULT: "#01202F", deep: "#01141E", card: "#032434", line: "#173A4D", field: "#0B3347" },
        frost: "#C3CAD1",
        ink: { DEFAULT: "#01202F", 2: "#26475A", muted: "#557080", faint: "#8AA2B0" },
        line: { DEFAULT: "#E1E8ED", strong: "#D5DEE4", input: "#C5D2DA" },
        brand: { DEFAULT: "#2E7BAA", hover: "#1F5F86", tint: "#E3F0F8", ink: "#1F5F86", glow: "#7CC8EC" },
        ok: { DEFAULT: "#0B6E4F", tint: "#DDF5EC" },
        whatsapp: { DEFAULT: "#25D366", ink: "#08361C", bubble: "#DCF8C6" },
        ai: { DEFAULT: "#5E35B1", tint: "#FBF8FF", line: "#E2D5FA", ink: "#3D1F7A" },
        warn: { DEFAULT: "#8A5300", tint: "#FFF4E5", line: "#F5D9A8" },
        danger: { DEFAULT: "#B42318", tint: "#FEE4E2" },
        st: {
          "new-bg": "#EEF1F4", "new-fg": "#4A5D6A",
          "asg-bg": "#E3F0F8", "asg-fg": "#1F5F86",
          "prog-bg": "#FFF1D6", "prog-fg": "#8A5300",
          "done-bg": "#DDF5EC", "done-fg": "#0B6E4F",
          "rev-bg": "#ECE8FB", "rev-fg": "#4E3A9E",
          "cls-bg": "#E8EBEE", "cls-fg": "#3F4A52"
        }
      },
      backgroundImage: {
        "brand-grad": "linear-gradient(160deg, #2E7BAA 0%, #0E3E5A 55%, #01202F 100%)",
        "brand-sky": "linear-gradient(162deg, #C3CAD1 0%, #9DB8CA 18%, #2E7BAA 48%, #0E3E5A 74%, #01202F 100%)",
        "brand-band": "linear-gradient(100deg, #C3CAD1 0%, #2E7BAA 50%, #01202F 100%)"
      },
      boxShadow: {
        card: "0 0 0 1px #E1E8ED",
        sec: "inset 0 0 0 1px #C5D2DA",
        lift: "0 10px 30px rgba(1, 32, 47, .12)",
        sheet: "0 -8px 28px rgba(1, 32, 47, .10)",
        cta: "0 8px 20px rgba(46, 123, 170, .28)"
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } }
      },
      animation: { "fade-up": "fade-up .25s ease-out both" }
    }
  },
  plugins: []
};

export default config;
