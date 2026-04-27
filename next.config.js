/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TypeScript hatalarını yayına alırken görmezden gelmesini sağlar
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint hatalarını da görmezden gelmesini sağlar
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
