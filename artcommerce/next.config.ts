import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  distDir: '.next',
  output: 'standalone',
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  // Ensure CSS is properly included
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
