import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  transpilePackages: ["@yunicity/types", "@yunicity/utils", "@yunicity/ui"],
  outputFileTracingRoot: workspaceRoot,
  // Dev uses `.next` ; production build uses `.next-build` (see package.json) to avoid races with `next dev`.
  distDir: process.env.NEXT_BUILD_DIR ?? ".next",
  eslint: { ignoreDuringBuilds: true },
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: "tsconfig.typecheck.json",
  },
};

export default nextConfig;
