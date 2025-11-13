/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  // tailwind.config.js
theme: {
  extend: {
    keyframes: {
      kenburns: {
        '0%': { transform: 'scale(1) translateY(0)' },
        '50%': { transform: 'scale(1.1) translateY(-10px)' },
        '100%': { transform: 'scale(1) translateY(0)' },
      },
      fadeUp: {
        '0%': { opacity: '0', transform: 'translateY(30px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
    },
    animation: {
      kenburns: 'kenburns 10s ease-in-out infinite',
      'fade-up': 'fadeUp 1.5s ease forwards',
    },
  },
},

  theme: {
    extend: {
      fontFamily: {
        // Global app font stack (DM Sans preferred, Poppins secondary)
        sans: [
          'DM Sans',
          'Poppins',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol'
        ]
      },
      colors: {
        // Optional brand alias (use as text-brand / bg-brand)
        brand: {
          DEFAULT: '#2563eb'
        }
      }
    }
  },
  plugins: []
};

