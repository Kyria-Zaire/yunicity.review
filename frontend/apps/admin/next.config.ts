import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  transpilePackages: ["@yunicity/types", "@yunicity/utils", "@yunicity/ui"],
  outputFileTracingRoot: workspaceRoot,
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
