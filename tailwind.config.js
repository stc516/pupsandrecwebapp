/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0d111c', // husky charcoal
          accent: '#2f73ff', // husky blue
          accentDeep: '#1b3a82',
          accentSoft: '#e7edff',
          background: '#ffffff',
          subtle: '#f3f4f8',
          border: '#e1e4ed',
          slate: '#5c6273',
          blush: '#ffe6db',
          sand: '#fef6ef',
          ice: '#d9e8ff',
        },
        text: {
          primary: '#0f172a',
          secondary: '#475467',
          muted: '#98a2b3',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 12px 24px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};

