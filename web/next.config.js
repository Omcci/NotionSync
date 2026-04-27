/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // This is the new, built-in way to do what next-transpile-modules did
  transpilePackages: ['lucide-react'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },

  // This is the key for creating an optimized production Docker image
  output: 'standalone',
}

module.exports = nextConfig
