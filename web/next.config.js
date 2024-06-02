const withTM = require('next-transpile-modules')(['lucide-react']); // Include your package here

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4001/:path*", // Proxy to Backend
      },
    ];
  },
};

module.exports = withTM(nextConfig);
