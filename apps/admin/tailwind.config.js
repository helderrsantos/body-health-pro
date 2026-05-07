/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#a9ff2e',
        'primary-dark': '#06000f',
        'primary-light': '#f1fff6',
        'accent': '#a9ff2e',
      },
      fontFamily: {
        'bebas': ['Bebas Neue', 'sans-serif'],
      },
      backgroundColor: {
        'dark-surface': 'rgba(6, 12, 8, 0.96)',
        'dark-surface-alt': 'rgba(3, 8, 5, 0.94)',
        'dark-card': 'rgba(8, 14, 11, 0.92)',
        'dark-input': 'rgba(11, 18, 14, 0.92)',
      },
      borderColor: {
        'accent-light': 'rgba(169, 255, 46, 0.42)',
        'accent-lighter': 'rgba(169, 255, 46, 0.32)',
      },
    },
  },
  plugins: [],
}
