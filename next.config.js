/** @type {import('next').NextConfig} */
const nextConfig = {
  // Externalize node-only libraries so they are required at runtime instead of bundled
  serverExternalPackages: ['mssql', 'tedious'],
  // If you also have pages (Pages Router), bundle everything then externalize these same packages
  bundlePagesRouterDependencies: true,

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
      { key: 'Content-Security-Policy',value: csp }
    ];
    const secureHeaders = isProd
      ? [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Permissions-Policy',
            value: [
              'geolocation=()',
              'microphone=()',
              'camera=()',
              'fullscreen=()',
              'payment=()'
            ].join(', ')
          }
        ]
      : [];

    return [
      {
        source: '/(.*)',
        headers: [...baseHeaders, ...secureHeaders],
      },
    ];
  },
};

module.exports = nextConfig;
