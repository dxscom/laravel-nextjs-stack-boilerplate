import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { resolve } from "path";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Monorepo root (where pnpm-workspace.yaml and main node_modules are)
const monorepoRoot = resolve(__dirname, "..");

const nextConfig: NextConfig = {
  // Set correct root for Turbopack (monorepo setup with pnpm workspaces)
  // Root must be monorepo root where node_modules with 'next' package exists
  turbopack: {
    root: monorepoRoot,
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
  transpilePackages: [
    "@famgia/omnify-react",
    "@famgia/omnify-react-sso",
    "@omnify-base",
  ],

  // Enable experimental symlink resolution for local packages
  experimental: {
    externalDir: true,
  },

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
