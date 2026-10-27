import { ImageResponse } from "next/og";
import { BRAND, markSvg } from "@/lib/brand";

/**
 * PNG app icons generated from the traced mark, for the PWA manifest and Apple devices.
 * /icons/192.png · /icons/512.png · /icons/maskable-512.png · /icons/apple-180.png
 */
const SIZES: Record<string, { size: number; maskable?: boolean }> = {
  "192.png": { size: 192 },
  "512.png": { size: 512 },
  "maskable-512.png": { size: 512, maskable: true },
  "apple-180.png": { size: 180, maskable: true }
};

export const dynamic = "force-static";

export function generateStaticParams() {
  return Object.keys(SIZES).map((file) => ({ file }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const spec = SIZES[file];
  if (!spec) return new Response("Not found", { status: 404 });

  const { size, maskable } = spec;
  // Maskable icons keep the mark inside the 80% safe zone and fill the whole square.
  const markWidth = Math.round(size * (maskable ? 0.42 : 0.5));
  const src = "data:image/svg+xml;utf8," + encodeURIComponent(markSvg("#FFFFFF"));

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(150deg, ${BRAND.blue} 0%, ${BRAND.navy} 100%)`,
          borderRadius: maskable ? 0 : size * 0.22
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={markWidth} height={Math.round(markWidth * (175 / 167))} alt="" />
      </div>
    ),
    { width: size, height: size }
  );
}
