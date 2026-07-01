import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost:3001",
    "*.loca.lt",
    "*.ngrok-free.dev",
    "*.lhr.life",
  ],
};

export default nextConfig;
