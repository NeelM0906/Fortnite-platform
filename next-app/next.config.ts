import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  async redirects() {
    return [
      // If user tries to access root, redirect them to dashboard if authenticated, otherwise to auth page
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      }
    ];
  }
};

export default nextConfig;
