import type { NextConfig } from 'next'

const isProduction = process.env.NODE_ENV === 'production'

// NOTE: Content-Security-Policy is intentionally NOT set here. It is generated
// per-request in middleware.ts with a unique nonce + 'strict-dynamic' so that
// inline-script XSS is blocked in modern browsers. Setting a static CSP here
// would force 'unsafe-inline' and defeat that protection.
const securityHeaders = [
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

if (isProduction) {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  })
}

const nextConfig: NextConfig = {
  // Pin the file-tracing root to this app. Without it Next walks up looking
  // for a lockfile, finds one in the developer's home directory, and picks
  // that as the workspace root — which both warns on every build and widens
  // the trace for standalone output far beyond the project.
  outputFileTracingRoot: __dirname,
  productionBrowserSourceMaps: false,
  distDir: '.next',
  images: {
    domains: [
      ...(!isProduction ? ['localhost'] : []),
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
