import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the project root so Next ignores lockfiles in parent folders.
  outputFileTracingRoot: path.resolve(".")
};

export default nextConfig;
