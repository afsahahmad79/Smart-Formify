import type { NextConfig } from "next";

const nextConfig = {
  /* config options here */
  // Optimize for memory usage
  compress: true,

  env: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    GOOGLE_SHEETS_CLIENT_EMAIL: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    GOOGLE_SHEETS_PRIVATE_KEY: process.env.GOOGLE_SHEETS_PRIVATE_KEY,
  },
} satisfies NextConfig;

export default nextConfig;
