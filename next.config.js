/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';

    // Base CSP you already have
    const csp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";

    // Common headers (always applied)
    const baseHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options',        value: 'DENY' },
      { key: 'X-XSS-Protection',       value: '1; mode=block' },
      { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
      { key: 'Content-Security-Policy',value: csp }
    ];

    // Extra security headers, prod only
    const secureHeaders = isProd
      ? [
          {
            key: 'Strict-Transport-Security',
            // 2 years, include subdomains, enable preload in browsers
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Permissions-Policy',
            // Block all powerful features by default
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
        // apply to all routes
        source: '/(.*)',
        headers: [
          ...baseHeaders,
          ...secureHeaders
        ],
      },
    ];
  },
};

module.exports = nextConfig;
