
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    // Allow data URLs for locally stored images
    dangerouslyAllowSVG: true, 
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // Needed for data URLs if not using unoptimized
    unoptimized: true, // Simplest way to allow data: URLs for next/image without complex CSP. Consider optimizing if performance becomes an issue.
  },
};

export default nextConfig;
