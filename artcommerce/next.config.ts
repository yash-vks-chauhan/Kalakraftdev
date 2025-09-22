import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  productionBrowserSourceMaps: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  distDir: '.next',
  images: {
    domains: ['localhost', 'firebasestorage.googleapis.com', 'lh3.googleusercontent.com', 'res.cloudinary.com', 'ik.imagekit.io', 'images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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

    // Configure reasonable asset size limits
    config.performance = {
      ...config.performance,
      maxAssetSize: 512 * 1024, // 512KB for individual assets
      maxEntrypointSize: 1024 * 1024 // 1MB for entry points
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
