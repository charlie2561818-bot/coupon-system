import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow mobile testing via local IP
  allowedDevOrigins: ['192.168.30.37', 'localhost'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_LIFF_ID: '2010743171-k1Xab8vM',
  },
};

export default nextConfig;
