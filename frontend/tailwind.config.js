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
        // Luxury Warm Light & Espresso Palette inspired by Darelief
        cream: {
          50: '#FAF8F5',  // Master Page Background (warm almond cream)
          100: '#F7F4EE', // Sidebar & Subtle Surface
          200: '#EFECE5', // Hover / Light border
          300: '#EAE5DC', // Standard Card & Divider Border
          400: '#DED7CB',
          500: '#C7BEAF',
        },
        ivory: {
          50: '#FFFFFF',  // Crisp Warm White Card
          100: '#FAF9F6', // Subtle Warm Panel
          200: '#F5F2EB', // Stone Fill
          300: '#EAE5DC', // Delicate Border
          400: '#DFD8CC',
        },
        espresso: {
          950: '#12100F',
          900: '#1A1817', // High-Contrast Primary Headings
          800: '#262321', // Dark UI Elements & Solid Buttons
          700: '#3D3835', // Secondary Dark
          600: '#5A544F', // Body Text
          500: '#78726D', // Muted Text & Subheadings
          400: '#9E9891',
          300: '#C2BCB3',
        },
        charcoal: {
          950: '#12100F',
          900: '#1A1817',
          800: '#262321',
          700: '#3D3835',
          600: '#5A544F',
          500: '#78726D',
          400: '#9E9891',
          300: '#C2BCB3',
        },
        burgundy: {
          50: '#FDF2F4',  // Light Burgundy Tint
          100: '#FCE4E8',
          200: '#F7C7D0',
          500: '#8C1D2F',
          600: '#6B1D2F', // Primary Accent (Category Tags, Brand Highlights)
          700: '#5C1D24', // Deep Wine Button / Focus
          800: '#451319',
        },
        wine: {
          50: '#FDF2F4',
          100: '#FCE4E8',
          200: '#F7C7D0',
          500: '#8C1D2F',
          600: '#6B1D2F',
          700: '#5C1D24',
          800: '#451319',
        },
        champagne: {
          50: '#FAF6ED',
          100: '#F5ECDA',
          200: '#EAD7B5',
          400: '#D3B878',
          500: '#B8944D', // Luxury Muted Gold
          600: '#9E7D3B',
          700: '#7F632B',
        },
        gold: {
          400: '#D3B878',
          500: '#B8944D',
          600: '#9E7D3B',
        },
        bronze: {
          300: '#EAD7B5',
          400: '#D3B878',
          500: '#B8944D',
          600: '#9E7D3B',
          700: '#7F632B',
        },
        sage: {
          50: '#F5F7F5',
          100: '#EAEFEA',
          200: '#D5DFD5',
          300: '#B9C8BA',
          400: '#97AA98',
          500: '#708672',
          600: '#536B55',
          700: '#3D523F',
        },
        // Ayurveda token remapped to warm luxury neutral & espresso palette
        ayurveda: {
          50: '#FAF8F5',
          100: '#F7F4EE',
          200: '#EAE5DC',
          300: '#DED7CB',
          400: '#78726D',
          500: '#5A544F',
          600: '#3D3835', // Deep Espresso
          700: '#262321', // Deep Charcoal
          800: '#1A1817', // High Contrast Primary
          900: '#12100F',
          950: '#FAF8F5', // Light surface fallback
        },
      },
    },
  },
  plugins: [],
}
