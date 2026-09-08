import type { NextConfig } from 'next';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'highlightly.net',
      },
      {
        protocol: 'https',
        hostname: '**.highlightly.net',
      },
    ],
  },
  transpilePackages: ['@pickbros/types', '@pickbros/ui'],
  ...(basePath
    ? {
        basePath,
        assetPrefix: basePath,
      }
    : {}),
};

export default nextConfig;
