import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  distDir: '.next',
  output: 'standalone',
  images: {
    domains: ['localhost', 'firebasestorage.googleapis.com', 'lh3.googleusercontent.com', 'res.cloudinary.com'],
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
    // Add proper handling for video files
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // Add specific handling for media files
    config.module.rules.push({
      test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash:8][ext]'
      }
    });

    // Configure asset size limits
    config.performance = {
      ...config.performance,
      maxAssetSize: 25 * 1024 * 1024, // 25MB
      maxEntrypointSize: 25 * 1024 * 1024 // 25MB
    };
    
    return config;
  },
  // Ensure public directory is copied to the output
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  // Increase the buffer size for large assets
  experimental: {
    largePageDataBytes: 128 * 1000, // 128KB
  },
};

export default nextConfig;
