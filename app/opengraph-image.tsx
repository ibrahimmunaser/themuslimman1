import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Default social-share image for every route that doesn't define its own
// opengraph-image.tsx. Ahrefs flagged og:image as missing site-wide (the
// Open Graph protocol requires title, type, image, and url) — this file
// fixes that for every page in one place via Next.js's metadata file
// convention, rather than hand-adding an `images` field to 10+ pages.
export const alt = "Complete Seerah | TheMuslimMan";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(
    join(process.cwd(), "public/images/logoicon.png"),
    "base64",
  );
  const logoSrc = `data:image/png;base64,${logoData}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A0A0F 0%, #1A1409 100%)",
          padding: 80,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={260} height={59} alt="" />
        <div
          style={{
            marginTop: 56,
            fontSize: 64,
            fontWeight: 700,
            color: "#F5F2EC",
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: 980,
          }}
        >
          Finish the Prophet&#39;s life in order — and retain it
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            color: "#C8A96E",
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          100 Parts · Complete Seerah
        </div>
      </div>
    ),
    { ...size },
  );
}
