/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand — Nurturing Circle palette
        peach:        '#FF9F7C',
        'peach-light':'#FFCFBB',
        'peach-dark': '#E8734A',
        'off-white':  '#FDF8F5',
        'warm-grey':  '#F5EDE8',
        // Text
        'text-primary':   '#2D1B13',
        'text-secondary': '#6B4C3B',
        'text-muted':     '#A08070',
        // Semantic
        'sentiment-positive': '#5CB87A',
        'sentiment-neutral':  '#F0B75B',
        'sentiment-negative': '#E05F5F',
        // Misc
        divider: 'rgba(255,159,124,0.25)',
        success: '#4CAF7D',
        danger:  '#D94F4F',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        'sm':   '8px',
        'md':   '14px',
        'lg':   '20px',
        'xl':   '28px',
        'full': '9999px',
      },
      fontFamily: {
        sans:        ['Poppins_400Regular'],
        medium:      ['Poppins_500Medium'],
        semibold:    ['Poppins_600SemiBold'],
        bold:        ['Poppins_700Bold'],
      },
    },
  },
  plugins: [],
};
