/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@openportal/shared", "@openportal/ui"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9000" },     // MinIO local
      { protocol: "https", hostname: "*.openportal.app" },           // Production
    ],
  },
};

export default nextConfig;
