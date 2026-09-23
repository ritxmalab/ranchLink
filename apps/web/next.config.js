// Next.js injects inline bootstrap scripts and Tailwind/styled-jsx inline styles,
// so 'unsafe-inline' is required here. Connect sources cover Supabase, Pinata,
// Alchemy/Base RPC and Stripe.
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.pinata.cloud https://gateway.pinata.cloud https://*.g.alchemy.com https://mainnet.base.org https://api.stripe.com",
  'upgrade-insecure-requests',
].join('; ')

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
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        source: '/a/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
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
