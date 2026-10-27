import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

/** Web app manifest: lets technicians install Sejuk Ops on their phone home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sejuk Ops",
    short_name: "Sejuk Ops",
    description: "Field jobs, service records and reviews for Sejuk Sejuk Service.",
    id: "/",
    start_url: "/technician/jobs",
    scope: "/",
    display: "standalone",
    background_color: BRAND.glacier,
    theme_color: BRAND.navy,
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" }
    ],
    shortcuts: [
      { name: "Today’s jobs", url: "/technician/jobs", icons: [{ src: "/icons/192.png", sizes: "192x192" }] },
      { name: "History", url: "/technician/history", icons: [{ src: "/icons/192.png", sizes: "192x192" }] }
    ]
  };
}
