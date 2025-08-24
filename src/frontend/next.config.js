/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Enable SWC minification for faster builds
  swcMinify: true,
  
  // Configure image optimization
  images: {
    domains: [
      'localhost',
      'memoria-eterna.com',
      'api.memoria-eterna.com',
      'cdn.memoria-eterna.com',
      'storage.googleapis.com',
      's3.amazonaws.com',
      'blob.core.windows.net'
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Configure experimental features
  experimental: {
    // Enable app directory (Next.js 13+)
    appDir: true,
    
    // Enable server components
    serverComponentsExternalPackages: ['@prisma/client'],
    
    // Enable concurrent features
    concurrentFeatures: true,
    
    // Enable server actions
    serverActions: true,
    
    // Enable typed routes
    typedRoutes: true,
    
    // Enable optimize package imports
    optimizePackageImports: [
      '@reduxjs/toolkit',
      'react-redux',
      '@tanstack/react-query',
      'framer-motion',
      'lucide-react',
      'recharts',
      'react-hook-form',
      'zod',
      'clsx',
      'tailwind-merge',
      'date-fns',
      'lodash',
      'ramda',
      'fp-ts'
    ],
  },
  
  // Configure webpack for better performance
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }
    
    // Add support for SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    return config;
  },
  
  // Configure headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Configure redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/auth/register',
        permanent: true,
      },
    ];
  },
  
  // Configure rewrites for API proxy
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${process.env.AUTH_SERVICE_URL}/api/auth/:path*`,
      },
      {
        source: '/api/users/:path*',
        destination: `${process.env.USER_SERVICE_URL}/api/users/:path*`,
      },
      {
        source: '/api/memories/:path*',
        destination: `${process.env.MEMORY_SERVICE_URL}/api/memories/:path*`,
      },
      {
        source: '/api/payments/:path*',
        destination: `${process.env.PAYMENTS_SERVICE_URL}/api/payments/:path*`,
      },
      {
        source: '/api/notifications/:path*',
        destination: `${process.env.NOTIFICATIONS_SERVICE_URL}/api/notifications/:path*`,
      },
      {
        source: '/api/media/:path*',
        destination: `${process.env.MEDIA_SERVICE_URL}/api/media/:path*`,
      },
      {
        source: '/api/analytics/:path*',
        destination: `${process.env.ANALYTICS_SERVICE_URL}/api/analytics/:path*`,
      },
    ];
  },
  
  // Configure environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Configure public runtime config
  publicRuntimeConfig: {
    // Will be available on both server and client
    staticFolder: '/static',
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    appName: 'Memoria Eterna',
    appVersion: process.env.npm_package_version || '1.0.0',
  },
  
  // Configure server runtime config
  serverRuntimeConfig: {
    // Will only be available on the server side
    authServiceUrl: process.env.AUTH_SERVICE_URL,
    userServiceUrl: process.env.USER_SERVICE_URL,
    memoryServiceUrl: process.env.MEMORY_SERVICE_URL,
    paymentsServiceUrl: process.env.PAYMENTS_SERVICE_URL,
    notificationsServiceUrl: process.env.NOTIFICATIONS_SERVICE_URL,
    mediaServiceUrl: process.env.MEDIA_SERVICE_URL,
    analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL,
  },
  
  // Configure TypeScript
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },
  
  // Configure ESLint
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  
  // Configure output
  output: 'standalone',
  
  // Configure trailing slash
  trailingSlash: false,
  
  // Configure base path
  basePath: '',
  
  // Configure asset prefix
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://cdn.memoria-eterna.com' : '',
  
  // Configure powered by header
  poweredByHeader: false,
  
  // Configure compress
  compress: true,
  
  // Configure generateEtags
  generateEtags: true,
  
  // Configure onDemandEntries
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  
  // Configure compiler
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
