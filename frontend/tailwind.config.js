/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        choco: { 50: '#faf6f3', 100: '#f1e8e1', 200: '#e1cfc2', 300: '#c9ad98', 400: '#a98266', 500: '#8a6248', 600: '#6f4a35', 700: '#573a2a', 800: '#3f2a1f', 900: '#2b1b13' },
        gold: { 50: '#fbf7ec', 100: '#f5ebcb', 300: '#e3c77a', 400: '#d4ab4a', 500: '#b8892d', 600: '#9a7024' },
      },
      fontFamily: { sans: ['Inter', 'Hind Siliguri', 'system-ui', 'sans-serif'], display: ['"Playfair Display"', 'Hind Siliguri', 'serif'] },
      boxShadow: { card: '0 1px 2px rgba(43,27,19,.06), 0 4px 16px rgba(43,27,19,.06)', lift: '0 8px 30px rgba(43,27,19,.14)' },
      keyframes: {
        pop: { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.35)' }, '100%': { transform: 'scale(1)' } },
        slideIn: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        fade: { from: { opacity: 0 }, to: { opacity: 1 } },
      },
      animation: { pop: 'pop .35s ease', slideIn: 'slideIn .28s ease-out', fade: 'fade .2s ease-out' },
    },
  },
  plugins: [],
};
