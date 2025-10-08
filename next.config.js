/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  // Enable TypeScript strict mode
  typescript: {
    ignoreBuildErrors: false,
  },
  // Enable ESLint during builds
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
