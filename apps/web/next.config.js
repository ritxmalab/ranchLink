/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Expose build info to client
  env: {
    NEXT_PUBLIC_BUILD_COMMIT: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || process.env.GIT_COMMIT || 'dev',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  // Prevent browsers and CDN from caching stale HTML pages
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    // Ignore optional ws dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        bufferutil: false,
        'utf-8-validate': false,
      }
    }
    return config
  },
}

module.exports = nextConfig
