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
    // Add proper handling for video files
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // Add specific handling for media files
    config.module.rules.push({
      test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/media/',
          outputPath: 'static/media/',
          name: '[name].[hash:8].[ext]',
        },
      },
    });
    
    return config;
  },
  // Ensure public directory is copied to the output
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  // Copy files from public directory to output
  outputFileTracing: true,
  // Increase the buffer size for large assets
  experimental: {
    largePageDataBytes: 128 * 1000, // 128KB
  },
};

export default nextConfig;
