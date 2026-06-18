import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@newmomcircle/api',
    '@newmomcircle/types',
    '@newmomcircle/utils',
    '@newmomcircle/validation',
    '@newmomcircle/ui',
    '@newmomcircle/i18n',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Add your Supabase storage hostname after setup:
      // { protocol: 'https', hostname: '<project-ref>.supabase.co' },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
