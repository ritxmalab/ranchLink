/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  reactStrictMode: true,
  ...(basePath && { basePath, assetPrefix: basePath }),
  output: 'standalone', // For Hostinger VPS deployment
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud', 'web3.storage'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.ipfs.io',
      },
      {
        protocol: 'https',
        hostname: '**.pinata.cloud',
      },
    ],
  },
  experimental: {
    serverActions: true,
  },
  // Ensure API routes work with basePath
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig

