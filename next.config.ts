import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    // Allow optimization of local static files (public/seerah-media/*)
    localPatterns: [
      {
        pathname: "/seerah-media/**",
      },
      {
        pathname: "/images/**",
      },
    ],
    // Allow R2 public URLs
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-5e47559fbd9145a4af1f58ceb3a42c81.r2.dev",
        pathname: "/**",
      },
    ],
    // Large slides/infographics — allow up to 100MB source files
    dangerouslyAllowSVG: false,
    // Serve modern formats
    formats: ["image/webp", "image/avif"],
    // Cache optimized images for 30 days — slides/infographics never change
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Reasonable device sizes for slide viewing
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 512],
  },
};

export default nextConfig;
