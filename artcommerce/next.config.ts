import type { NextConfig } from 'next'

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "media-src 'self' https: data: blob:",
  "img-src 'self' https: data: blob:",
  "font-src 'self' https: data:",
  "style-src 'self' 'unsafe-inline' https:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.googletagmanager.com https://js.pusher.com",
  "connect-src 'self' https://api.sendinblue.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.pusherapp.com https://*.pusher.com wss://ws-*.pusher.com",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  distDir: '.next',
  images: {
    domains: [
      'localhost',
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
      'res.cloudinary.com',
      'ik.imagekit.io',
      'images.unsplash.com',
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'ik.imagekit.io' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  webpack: (config) => {
    config.module = config.module || {}
    config.module.rules = config.module.rules || []

    config.module.rules.push({
      test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash:8][ext]',
      },
    })

    config.performance = {
      ...config.performance,
      maxAssetSize: 512 * 1024,
      maxEntrypointSize: 1024 * 1024,
    }

    return config
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  experimental: {
    largePageDataBytes: 128 * 1000,
  },
}

export default nextConfig
