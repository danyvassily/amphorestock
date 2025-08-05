import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        // Breakpoints existants de Tailwind
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        
        // Breakpoints spécifiques pour iPad
        'ipad-portrait': {
          'min': '768px',
          'max': '834px',
          'orientation': 'portrait'
        },
        'ipad-landscape': {
          'min': '1024px',
          'max': '1366px',
          'orientation': 'landscape'
        },
        'ipad': {
          'min': '768px',
          'max': '1024px'
        },
        'ipad-pro': {
          'min': '1024px',
          'max': '1366px'
        },
        // Utilitaire pour tout appareil iPad
        'any-ipad': '(min-device-width: 768px) and (max-device-width: 1366px) and (-webkit-min-device-pixel-ratio: 1)'
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      }
    },
  },
  plugins: [],
}

export default config