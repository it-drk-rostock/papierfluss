
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  experimental: {
    authInterrupts: true,
  },
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: 'tsconfig.json',
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;


