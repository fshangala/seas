import type { NextConfig } from "next";
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // turbopack: {} // Attempting to silence the error by acknowledging turbopack
  }
};

// If Next.js 16 forces turbopack, we might need to use --webpack flag in scripts
// or use a configuration that Next.js doesn't bail on.
export default withPWA(nextConfig);
