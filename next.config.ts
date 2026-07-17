import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow mobile testing via local IP
  allowedDevOrigins: ['192.168.30.37', 'localhost'],
};

export default nextConfig;
