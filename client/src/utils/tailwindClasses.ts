// Tailwind CSS Utility Classes for Teen Patti Game

/**
 * Button Variants
 */
export const buttonStyles = {
  primary: "bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95",
  secondary: "bg-casino-green hover:bg-casino-green-dark text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95",
  gold: "bg-casino-gold hover:bg-casino-gold-dark text-gray-900 font-bold py-3 px-6 rounded-lg shadow-casino transition-all duration-200 hover:scale-105 active:scale-95",
  danger: "bg-casino-red hover:bg-casino-red-dark text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95",
  disabled: "bg-gray-600 text-gray-400 font-bold py-3 px-6 rounded-lg cursor-not-allowed opacity-50",
  outline: "border-2 border-casino-gold text-casino-gold hover:bg-casino-gold hover:text-gray-900 font-bold py-3 px-6 rounded-lg transition-all duration-200",
};

/**
 * Card Styles
 */
export const cardStyles = {
  container: "bg-white rounded-lg shadow-card border-2 border-gray-200",
  playing: "w-16 h-24 rounded-lg shadow-card transition-all duration-300 hover:scale-110 cursor-pointer",
  playingLarge: "w-20 h-32 rounded-lg shadow-card transition-all duration-300",
  back: "bg-gradient-to-br from-blue-800 to-blue-900 border-2 border-yellow-400",
};

/**
 * Table & Layout
 */
export const tableStyles = {
  main: "min-h-screen bg-gradient-to-br from-gray-900 via-casino-green-dark to-gray-900",
  felt: "bg-casino-green border-4 border-casino-gold rounded-3xl shadow-2xl",
  potDisplay: "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white font-bold text-2xl py-4 px-8 rounded-full shadow-glow animate-pulse-slow",
  infoPanel: "bg-gray-800 bg-opacity-90 text-white rounded-xl p-4 shadow-xl border border-casino-gold",
};

/**
 * Player Styles
 */
export const playerStyles = {
  container: "relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300",
  active: "bg-casino-gold bg-opacity-20 border-2 border-casino-gold shadow-glow",
  inactive: "bg-gray-800 bg-opacity-50 border-2 border-gray-700",
  folded: "opacity-40 grayscale",
  avatar: "w-16 h-16 rounded-full border-4 border-casino-gold shadow-lg",
  name: "text-white font-bold text-lg",
  chips: "text-casino-gold font-semibold text-sm",
};

/**
 * Betting & Actions
 */
export const bettingStyles = {
  panel: "flex gap-3 items-center justify-center p-4 bg-gray-800 bg-opacity-90 rounded-xl border-2 border-casino-gold",
  chip: "w-12 h-12 rounded-full flex items-center justify-center font-bold cursor-pointer transition-transform hover:scale-110 active:scale-95 shadow-lg animate-chip-toss",
  chipValues: {
    10: "bg-red-600 text-white border-2 border-red-800",
    20: "bg-blue-600 text-white border-2 border-blue-800",
    50: "bg-green-600 text-white border-2 border-green-800",
    100: "bg-yellow-600 text-white border-2 border-yellow-800",
    500: "bg-purple-600 text-white border-2 border-purple-800",
  },
};

/**
 * Status & Notifications
 */
export const statusStyles = {
  success: "bg-green-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg animate-bounce-slow",
  error: "bg-red-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg animate-bounce-slow",
  warning: "bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg shadow-lg",
  info: "bg-blue-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg",
  countdown: "text-6xl font-bold text-casino-gold animate-pulse drop-shadow-glow",
};

/**
 * Animation Classes
 */
export const animations = {
  fadeIn: "animate-[fadeIn_0.5s_ease-in]",
  fadeOut: "animate-[fadeOut_0.5s_ease-out]",
  slideInLeft: "animate-[slideInLeft_0.5s_ease-out]",
  slideInRight: "animate-[slideInRight_0.5s_ease-out]",
  cardDeal: "animate-card-deal",
  chipToss: "animate-chip-toss",
  pulse: "animate-pulse-slow",
};

/**
 * Responsive Utilities
 */
export const responsive = {
  container: "container mx-auto px-4 sm:px-6 lg:px-8",
  grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
  flexCenter: "flex items-center justify-center",
  flexBetween: "flex items-center justify-between",
};

/**
 * Helper function to combine classes
 */
export const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};
