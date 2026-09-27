/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ayurveda: {
          50: '#f2f8f5',
          100: '#e1f0e8',
          200: '#c4e2d3',
          300: '#9bceb6',
          400: '#6bb293',
          500: '#459675',
          600: '#2d6a4f', // Herbal Green
          700: '#1b4332', // Deep Forest Green
          800: '#17392b',
          900: '#0d221a',
          950: '#06130e',
        },
        gold: {
          400: '#f3c64c',
          500: '#d4af37', // Gold Accent
          600: '#b89228',
        },
        cream: {
          50: '#faf9f6',
          100: '#f4f1ea',
          200: '#e8e2d5',
        }
      },
    },
  },
  plugins: [],
}
