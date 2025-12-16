/**
 * Sound Configuration File
 * 
 * This file centralizes all sound file paths and settings.
 * Easy to update - just change the paths or add new sounds here!
 */

export const SOUND_CONFIG = {
  // Background Music (looping)
  BACKGROUND: {
    APP: '/sounds/app-background.mp3',      // Plays in menus/dashboard
    GAME: '/sounds/game-background.mp3',    // Plays during gameplay
  },

  // UI Sound Effects
  UI: {
    BUTTON_CLICK: '/sounds/button-click.mp3',  // All button clicks
    TAB_SWITCH: '/sounds/button-click.mp3',    // Tab switches (reuses button click)
    CLICKING: '/sounds/clicking.mp3',           // Human clicking/pressing sound
  },

  // Game Actions
  GAME: {
    CARD_DISTRIBUTE: '/sounds/card-distribute.mp3',  // Cards being dealt
    SEE: '/sounds/see.mp3',                           // SEE button - card reveal sound
    CHAAL: '/sounds/chaal.mp3',                       // Seen bet
    BLIND: '/sounds/blind.mp3',                       // Blind bet
    FOLD: '/sounds/fold.mp3',                         // Player folds/packs
    RAISE: '/sounds/raise.mp3',                       // Bet above minimum
    WINNER: '/sounds/winner.mp3',                     // Winner announcement
  },

  // Game Results
  RESULTS: {
    WINNER: '/sounds/winner.mp3',  // Player wins
    LOSER: '/sounds/loser.mp3',    // Player loses
  },

  // Transactions
  TRANSACTION: {
    COINS: '/sounds/coin.mp3',  // Token transfers, tips
  },
} as const;

// Volume Configuration (0.0 to 1.0)
export const VOLUME_CONFIG = {
  BACKGROUND_MUSIC: 0.3,
  BUTTON_CLICK: 0.5,
  TAB_SWITCH: 0.3,
  CLICKING: 0.6,
  CARD_DISTRIBUTE: 0.5,
  CHAAL: 0.6,
  BLIND: 0.6,
  FOLD: 0.5,
  RAISE: 0.65,
  WINNER: 0.7,
  LOSER: 0.6,
  COINS: 0.5,
} as const;

// Preload Settings
export const PRELOAD_CONFIG = {
  // Which sounds to preload on app start (faster playback)
  PRELOAD: ['metadata', 'auto', 'none'] as const,
  DEFAULT: 'metadata' as const,  // Faster than 'auto', lighter than full preload
} as const;

/**
 * HOW TO USE:
 * 
 * 1. To change a sound file:
 *    - Replace the path in SOUND_CONFIG
 *    - Example: CHAAL: '/sounds/my-new-chaal-sound.mp3'
 * 
 * 2. To adjust volume:
 *    - Update the value in VOLUME_CONFIG (0.0 = mute, 1.0 = max)
 * 
 * 3. To add a new sound:
 *    - Add it to the appropriate category in SOUND_CONFIG
 *    - Add its volume to VOLUME_CONFIG
 *    - Import and use in SoundManager
 * 
 * 4. All changes in this file automatically apply everywhere!
 */

export default SOUND_CONFIG;
