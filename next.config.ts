import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['mssql', 'tedious'],
  bundlePagesRouterDependencies: true,

  webpack: (config, { isServer }) => {
        console.log(
      `[next.config.ts] webpack() called — isServer=${isServer}`
    );
    // 1️⃣ On the server build, treat mssql & tedious as externals so Webpack
    //    leaves their `import "node:stream"` etc. to Node at runtime:
    if (isServer) {
      const existing = Array.isArray(config.externals)
        ? config.externals
        : [config.externals];
      config.externals = [...existing, 'mssql', 'tedious'];
    }

    // 2️⃣ Alias node: imports so if anything else pulls them in, Webpack can resolve:
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'node:stream': 'stream',
      'node:url':    'url',
    };

    return config;
  },

  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    const csp = isProd
      ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
      : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';";

    const baseHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options',        value: 'DENY' },
      { key: 'X-XSS-Protection',       value: '1; mode=block' },
      { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
      { key: 'Content-Security-Policy',value: csp },
    ];
    const secureHeaders = isProd
      ? [
          { key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy',
            value: ['geolocation=()', 'microphone=()', 'camera=()', 'fullscreen=()', 'payment=()']
                     .join(', ') },
        ]
      : [];
    return [{ source: '/(.*)', headers: [...baseHeaders, ...secureHeaders] }];
  },
};

export default nextConfig;