/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        base: {
          900: '#0b1020',
          800: '#111834',
          700: '#1a2350',
        },
        brand: {
          400: '#7c9cff',
          500: '#5b7bff',
          600: '#4560e6',
        },
        accent: {
          cyan: '#22d3ee',
          violet: '#a78bfa',
          pink: '#f472b6',
          lime: '#a3e635',
        },
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(91,123,255,0.55)',
        'glow-lg': '0 0 70px -10px rgba(124,156,255,0.65)',
        card: '0 20px 50px -20px rgba(0,0,0,0.7)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
