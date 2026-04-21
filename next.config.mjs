/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // pdfjs-dist is browser-only — don't attempt to bundle it on the server
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "pdfjs-dist",
      ];
    }
    // pdfjs tries to require 'canvas' in Node — alias it to false
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
