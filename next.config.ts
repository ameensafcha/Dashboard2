import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  serverExternalPackages: ["@prisma/client", "prisma"],

  // Multiple lockfiles/turbopack fix
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Bundle size optimize
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@hello-pangea/dnd', 'date-fns']
  }
};

export default nextConfig;
