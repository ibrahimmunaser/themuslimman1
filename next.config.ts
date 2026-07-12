import type { NextConfig } from "next";
import path from "path";

const securityHeaders = [
  { key: "X-Frame-Options",           value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Stripe checkout JS + Facebook Pixel
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://connect.facebook.net",
      // Stripe iframe
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      // API calls: Stripe, R2, Vercel Analytics, Facebook
      "connect-src 'self' https://api.stripe.com https://*.r2.dev https://*.r2.cloudflarestorage.com https://vitals.vercel-insights.com https://www.facebook.com https://www.google-analytics.com",
      // Inline styles (Tailwind), Google Fonts if used
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // R2 images, stripe logos, Facebook tracking pixel
      "img-src 'self' data: blob: https://*.r2.dev https://*.r2.cloudflarestorage.com https://img.stripe.com https://www.facebook.com",
      "media-src 'self' blob: https://*.r2.dev https://*.r2.cloudflarestorage.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Immutable static assets (Next.js hashed filenames).
      // Only in production — in dev, chunk names are stable across recompiles
      // so an immutable cache would permanently serve stale bundles.
      ...(process.env.NODE_ENV === "production"
        ? [
            {
              source: "/_next/static/(.*)",
              headers: [
                { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
              ],
            },
          ]
        : []),
      // Warm endpoint: fire-and-forget, no browser caching needed
      {
        source: "/api/part/:partNumber/warm",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      // Signed-URL endpoint is auth-gated; prevent any caching
      {
        source: "/api/assets/signed-url",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
      // Public images — cache aggressively at the CDN edge.
      // These files are versioned via query string when they change.
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  productionBrowserSourceMaps: false,
  // The webpack build worker runs webpack compilation in a spawned
  // jest-worker child process (on by default whenever there's no custom
  // webpack() config, which is our case). On this machine/Node version that
  // child process crashes on Windows with exit code 3221225725
  // (0xC00000FD = STATUS_STACK_OVERFLOW) almost immediately after
  // "Creating an optimized production build...", before any real
  // compilation output appears — a known Next.js/Windows/jest-worker
  // incompatibility. Disabling the worker runs webpack compilation in the
  // main `next build` process instead.
  //
  // cpus caps worker processes for "Collecting page data" / "Generating static
  // pages". Default is os.cpus().length - 1 (15 on this 16-core machine).
  // Each worker inherits NODE_OPTIONS heap caps but can still allocate large
  // native/off-heap memory, so fewer workers = lower peak RAM.
  //
  // webpackMemoryOptimizations: official Next.js flag (v15+) that reduces
  // peak webpack RSS during "Creating an optimized production build" by
  // changing webpack string-buffer caching (see memory-usage.md in next/dist).
  experimental: {
    webpackBuildWorker: false,
    webpackMemoryOptimizations: true,
    cpus: 1,
    serverSourceMaps: false,
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
        hostname: "*.r2.cloudflarestorage.com",
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
