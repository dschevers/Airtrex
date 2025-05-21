/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prevent bundling server-only modules into edge/client builds
    serverComponentsExternalPackages: ['mssql', 'tedious'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Alias Node.js core imports so Webpack resolves `node:` schemes
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        'node:stream': 'stream',
        'node:url': 'url',
      };
    }
    return config;
  },
};

module.exports = nextConfig;