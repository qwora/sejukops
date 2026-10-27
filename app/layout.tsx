import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/lib/session";
import { BRAND } from "@/lib/brand";
import { ServiceWorkerRegister } from "@/components/pwa/install-prompt";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: BRAND.name, template: "%s · " + BRAND.name },
  description: "Service operations for Sejuk Sejuk Service: orders, field jobs, reviews and performance.",
  applicationName: BRAND.name,
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icons/192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-180.png", sizes: "180x180" }]
  },
  appleWebApp: { capable: true, title: BRAND.name, statusBarStyle: "black-translucent" }
};

export const viewport: Viewport = { themeColor: BRAND.navy, width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <SessionProvider>{children}</SessionProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
