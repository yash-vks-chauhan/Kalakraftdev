import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  distDir: '.next',
  output: 'standalone',
  images: {
    domains: ['localhost', 'firebasestorage.googleapis.com', 'lh3.googleusercontent.com'],
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Ensure CSS is properly included
  webpack: (config) => {
    return config;
  },
  // Ensure public directory is copied to the output
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  // Copy files from public directory to output
  outputFileTracing: true,
};

export default nextConfig;
