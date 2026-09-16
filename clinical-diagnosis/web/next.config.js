/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    proxyClientMaxBodySize: "512mb",
    serverActions: {
      bodySizeLimit: "512mb",
    },
  },
  async rewrites() {
    const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:8001";
    const imagingApi = process.env.IMAGING_API_URL ?? "http://42.81.102.195:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backend}/api/v1/:path*`,
      },
      {
        source: "/imaging-api/:path*",
        destination: `${imagingApi}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
