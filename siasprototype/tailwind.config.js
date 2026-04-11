/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#f5eded',
          100: '#ebd7dc',
          200: '#d7afb8',
          300: '#c38795',
          400: '#af5f71',
          500: '#8B1C3E',
          600: '#722D43',
          700: '#5a2435',
          800: '#421a26',
          900: '#2a1018',
        },
        gold: {
          50: '#fffef0',
          100: '#fffce1',
          200: '#fff9c2',
          300: '#fff5a3',
          400: '#ffe885',
          500: '#FFD700',
          600: '#D4AF37',
          700: '#a68d2e',
          800: '#786a24',
          900: '#4a401b',
        },
      },
    },
  },
  plugins: [],
}

