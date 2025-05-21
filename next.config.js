/** @type {import('next').NextConfig} */
const nextConfig = {
  // opt out mssql/tedious from being bundled in Server Components & Route Handlers
  serverExternalPackages: ['mssql', 'tedious'],  // :contentReference[oaicite:0]{index=0}

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // allow Webpack to resolve `node:stream` & `node:url`
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        'node:stream': 'stream',
        'node:url':    'url',
      };
    }
    return config;
  },
};

module.exports = nextConfig;
