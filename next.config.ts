import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
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
