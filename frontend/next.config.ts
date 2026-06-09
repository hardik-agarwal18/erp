import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/v1/storage/:path*",
        // Proxy storage downloads directly to the backend
        destination: "http://localhost:5000/api/v1/storage/:path*",
      },
    ];
  },
};

export default nextConfig;
