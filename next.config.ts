import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content Security Policy: the browser only loads scripts, images and
// connections from the sources listed here.
//
// If something on the site stops loading after a change, DevTools > Console
// shows "Refused to load ... because it violates the Content Security Policy
// directive ..." naming the blocked source; add that source to the matching
// directive below.
const csp = [
  "default-src 'self'",
  // Next.js injects inline scripts for hydration; 'unsafe-eval' is only
  // needed by the dev server. (Zod's JIT parser, which would also need eval,
  // is turned off in the browser by lib/zodBrowserConfig.ts.)
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
  "frame-ancestors 'none'", // nobody can embed the site in an iframe
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
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
