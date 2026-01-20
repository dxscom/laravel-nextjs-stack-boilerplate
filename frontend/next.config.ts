import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Set correct root for Turbopack (monorepo setup)
  turbopack: {
    root: __dirname,
  },

  // Allow HMR WebSocket connections from proxy domains
  // Use multiple patterns to cover different subdomain levels
  allowedDevOrigins: [
    "*.test",                   // Laravel Herd/Valet local domains
    "*.app",
    "*.dev.omnify.jp",
    "*.*.dev.omnify.jp",        // project.dev.dev.omnify.jp
    "*.*.*.dev.omnify.jp",      // extra level
  ],

  // Transpile linked packages (required for Turbopack with symlinked packages)
  transpilePackages: ["@famgia/omnify-react-sso", "@omnify-client", "@omnify-base"],

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.app",
      },
      {
        protocol: "https",
        hostname: "**.dev.omnify.jp",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
