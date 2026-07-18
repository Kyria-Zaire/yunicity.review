import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { culturalImageRemotePatterns } from "./lib/cultural-image-hosts";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * Refuse a deployed production build with no site URL configured (issue #132, cas 1).
 *
 * getSiteUrl() falls back to http://localhost:3000, and NEXT_PUBLIC_* are inlined into the
 * bundle at build time: a build without this variable ships canonical, og:url, og:image,
 * JSON-LD and sitemap all pointing at localhost, with nothing raised anywhere. That is
 * exactly what happened in production (PROD-BUG-03). Failing the build is free — the value
 * cannot be repaired afterwards without a full rebuild.
 *
 * Deliberately narrow so it never fires where the variable is legitimately absent:
 * - only during `next build` (not `next dev`, not `next start`)
 * - only on Railway, where a build IS a deployment — CI and local builds are untouched
 */
function assertSiteUrlConfiguredForDeploy(phase: string): void {
  if (phase !== PHASE_PRODUCTION_BUILD || !process.env.RAILWAY_ENVIRONMENT) {
    return;
  }
  const siteUrl =
    process.env.NEXT_PUBLIC_WEB_APP_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) {
    throw new Error(
      "NEXT_PUBLIC_WEB_APP_URL is required for a deployed production build. Without it the " +
        "site URL falls back to http://localhost:3000, which would be inlined into the " +
        "bundle: canonical tags, og:url, og:image, JSON-LD and sitemap.xml would all point " +
        "at localhost. Set NEXT_PUBLIC_WEB_APP_URL on this Railway service and redeploy.",
    );
  }
}

const nextConfig: NextConfig = {
  transpilePackages: ["@yunicity/types", "@yunicity/utils", "@yunicity/ui"],
  outputFileTracingRoot: workspaceRoot,
  images: {
    remotePatterns: culturalImageRemotePatterns(),
  },
  // Dev uses `.next` ; production build uses `.next-build` (see package.json) to avoid races with `next dev`.
  distDir: process.env.NEXT_BUILD_DIR ?? ".next",
  eslint: { ignoreDuringBuilds: true },
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: "tsconfig.typecheck.json",
  },
};

export default (phase: string): NextConfig => {
  assertSiteUrlConfiguredForDeploy(phase);
  return nextConfig;
};
