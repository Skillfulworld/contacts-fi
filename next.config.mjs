/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output bundles everything needed for a self-contained deployment
  // on Vercel, Netlify, Railway, Fly.io, or any Docker/Node host.
  output: 'standalone',

  eslint: {
    // Lint errors do not block production builds — run lint separately in CI.
    ignoreDuringBuilds: true,
  },

  // Allow next/image to serve branding assets without explicit domain config.
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
