import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
