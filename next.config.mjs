/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  // standalone only for production builds — interferes with dev HMR
  ...(isDev ? {} : { output: 'standalone' }),

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    unoptimized: false,
  },

  // Force no-cache headers on all JS/CSS chunks so the browser never
  // serves a stale bundle after a code change.
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ];
  },


};

export default nextConfig;
