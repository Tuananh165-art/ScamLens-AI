import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.SCAMLENS_NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  serverExternalPackages: ["@google/genai"],
};

export default nextConfig;
