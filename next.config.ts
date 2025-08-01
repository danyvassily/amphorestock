import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration pour le rendu
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Configuration webpack pour Firebase
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Resolve fallbacks pour Firebase côté client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    return config;
  },
  
  // Variables d'environnement publiques
  env: {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'amphore-stock',
  },
  
  // Configuration du bundler
  transpilePackages: [
    'firebase',
    '@firebase/auth',
    '@firebase/firestore',
    '@firebase/analytics'
  ],
  
  // Optimisations
  compress: true,
  poweredByHeader: false,
  
  // Configuration pour ignorer temporairement les erreurs de build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Images
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
