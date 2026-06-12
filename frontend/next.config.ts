import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Note: Do NOT set output: "standalone" — Vercel handles Next.js natively.
  // "standalone" is only for Docker/self-hosted deployments and breaks Vercel deploys.
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL || "http://localhost:5000";
    return [
      {
        source: "/api/v1/storage/:path*",
        // Proxy storage downloads to the backend (set BACKEND_URL in Vercel env vars)
        destination: `${backendUrl}/api/v1/storage/:path*`,
      },
    ];
  },
};

export default nextConfig;
