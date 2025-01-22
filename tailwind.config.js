/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#323E8F',
        'primary-dark': '#1E2657',
      },
      keyframes: {
        loadingDot: {
          '0%': { opacity: 0 },
          '50%': { opacity: 1 },
          '100%': { opacity: 0 }
        },
        loadingText: {
          '0%, 20%': { opacity: 0, transform: 'translateY(3px)' },
          '50%, 100%': { opacity: 1, transform: 'translateY(0)' }
        }
      },
      animation: {
        loadingDot: 'loadingDot 1.5s infinite',
        loadingText: 'loadingText 1s ease-out forwards'
      }
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
