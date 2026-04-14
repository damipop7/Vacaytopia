/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          brand: '#034694',
          mid:   '#1a5fa8',
          light: '#6A7AB5',
          tint:  '#E8F0FB',
        },
        gold: {
          brand: '#F5A623',
          dark:  '#D4880F',
          tint:  '#fff8ee',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        pill: '9999px',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.35s ease-out both',
      },
    },
  },
  plugins: [],
}
