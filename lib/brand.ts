/** Sejuk Sejuk brand constants, shared by components, icons and the PWA manifest. */

export const BRAND = {
  name: "Sejuk Ops",
  company: "Sejuk Sejuk Service Sdn Bhd",
  navy: "#01202F",
  abyss: "#01141E",
  blue: "#2E7BAA",
  frost: "#C3CAD1",
  glacier: "#F2F5F7",
  ice: "#7CC8EC"
} as const;

/** The traced mark, drawn in a 167 × 175 box. */
export const MARK_VIEWBOX = "0 0 167 175";
export const MARK_PATHS = [
  "M0 0H44V52.6A116 116 0 0 1 126 11.2V57.4A70 70 0 0 0 63 127H0Z",
  "M53 175A114 114 0 0 1 167 61V105A70 70 0 0 0 114.2 129H167V175Z"
] as const;

/** The mark as a standalone SVG string (for data URIs in generated icons). */
export function markSvg(color = "#FFFFFF") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}">${MARK_PATHS.map((d) => `<path fill="${color}" d="${d}"/>`).join("")}</svg>`;
}
