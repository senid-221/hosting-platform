import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["bullmq", "ioredis"],
};
export default nextConfig;
