/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Authentic Teen Patti Casino Color Palette
        primary: {
          DEFAULT: '#B01919', // Casino Red - Main background, headers, branding
          light: '#d42727',
          dark: '#8f1414',
        },
        secondary: {
          DEFAULT: '#FFD700', // Gold - Win highlights, banners, chips, icons
          light: '#ffe44d',
          dark: '#b8860b',
        },
        accent: {
          green: '#147E04', // Casino Green - Table felt, accent areas
          'green-light': '#1a9e05',
          'green-dark': '#0f5f03',
          black: '#121212', // Rich Black - Buttons, overlays, sidebars
          'off-white': '#F5F6FA', // Card faces, secondary panels
          silver: '#C9C9C9', // Divider lines, chip edges
        },
        // Casino-specific colors
        casino: {
          red: '#B01919',
          'red-light': '#d42727',
          'red-dark': '#8f1414',
          green: '#147E04',
          'green-light': '#1a9e05',
          'green-dark': '#0f5f03',
          gold: '#FFD700',
          'gold-light': '#ffe44d',
          'gold-dark': '#b8860b',
          black: '#121212',
          'off-white': '#F5F6FA',
          silver: '#C9C9C9',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'chip-toss': 'chipToss 0.5s ease-out',
        'card-deal': 'cardDeal 0.4s ease-out',
      },
      keyframes: {
        chipToss: {
          '0%': { transform: 'translateY(-20px) scale(0.8)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        cardDeal: {
          '0%': { transform: 'translateX(-100px) rotateY(90deg)', opacity: '0' },
          '100%': { transform: 'translateX(0) rotateY(0deg)', opacity: '1' },
        },
      },
      boxShadow: {
        'casino': '0 0 20px rgba(255, 215, 0, 0.3)',
        'card': '0 4px 8px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 15px rgba(255, 215, 0, 0.5)',
      },
    },
  },
  plugins: [],
}
