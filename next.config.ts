import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Full Content Security Policy, sent in REPORT-ONLY mode for now: browsers
// log what it would block (DevTools console: "[Report Only] Refused to ...")
// but don't block anything. Once the console is clean on the real site, move
// these rules into `enforcedCsp` below.
const reportOnlyCsp = [
  "default-src 'self'",
  // Next.js injects inline scripts for hydration; 'unsafe-eval' is only
  // needed by the dev server.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Mantine/BlockNote and Tailwind use inline styles
  "style-src 'self' 'unsafe-inline'",
  // Edge Store uploads, plus OAuth profile photos shown in <img> tags
  "img-src 'self' data: blob: https://files.edgestore.dev https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
  "media-src 'self' blob: https://files.edgestore.dev",
  "font-src 'self' data:",
  // Socket.IO (ws/wss) and Edge Store uploads
  "connect-src 'self' ws: wss: https://files.edgestore.dev https://*.edgestore.dev https://*.amazonaws.com",
  "worker-src 'self' blob:",
  "frame-src 'self'",
].join("; ");

// Directives that can't break normal pages, so they're enforced right away
const enforcedCsp = [
  "frame-ancestors 'none'", // nobody can embed the site in an iframe
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: enforcedCsp },
  { key: "Content-Security-Policy-Report-Only", value: reportOnlyCsp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // HTTPS only (browsers ignore this on http://localhost)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework in an X-Powered-By header
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "files.edgestore.dev",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
