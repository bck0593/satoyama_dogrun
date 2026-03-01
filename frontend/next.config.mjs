/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.blob.core.windows.net" }],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Prevent intermittent PackFileCache rename failures on Windows dev environments.
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
