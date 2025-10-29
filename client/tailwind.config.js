/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Casino theme colors
        casino: {
          green: '#0a5f38',
          'green-dark': '#064029',
          'green-light': '#0d7a4a',
          gold: '#ffd700',
          'gold-dark': '#b8860b',
          red: '#dc2626',
          'red-dark': '#991b1b',
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
