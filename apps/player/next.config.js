/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@fwaya/player-sdk'],
  experimental: {
    externalDir: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
      ],
    },
  ],
};

module.exports = nextConfig;