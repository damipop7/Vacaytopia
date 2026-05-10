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
      /* Design token spacing scale: 4/8/12/16/24/32/48px */
      spacing: {
        'token-xs':  '4px',
        'token-sm':  '8px',
        'token-md':  '12px',
        'token-lg':  '16px',
        'token-xl':  '24px',
        'token-2xl': '32px',
        'token-3xl': '48px',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn:  'fadeIn 0.35s ease-out both',
        slideUp: 'slideUp 0.4s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
}
