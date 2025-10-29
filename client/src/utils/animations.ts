import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

/**
 * Framer Motion Animation Variants for Teen Patti Game
 */

// Card dealing animation
export const cardDealVariants: Variants = {
  hidden: {
    rotateY: 90,
    opacity: 0,
    x: -100,
  },
  visible: (custom: number) => ({
    rotateY: 0,
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      delay: custom * 0.1,
      ease: "easeOut",
    },
  }),
};

// Chip toss animation
export const chipTossVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
    y: 20,
  },
  visible: (custom: number) => ({
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      delay: custom * 0.05,
      type: "spring",
      stiffness: 200,
    },
  }),
};

// Button press animation
export const buttonPressVariants: Variants = {
  idle: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    y: -2,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.95,
  },
};

// Fade in/out
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// Slide from bottom
export const slideUpVariants: Variants = {
  hidden: {
    y: 50,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

// Pot pulse animation
export const potPulseVariants: Variants = {
  idle: {
    scale: 1,
  },
  pulse: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
};

// Winner celebration
export const winnerVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
    rotate: -180,
  },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 10,
    },
  },
};

// Player turn indicator
export const turnIndicatorVariants: Variants = {
  inactive: {
    scale: 1,
    opacity: 0.5,
  },
  active: {
    scale: [1, 1.1, 1],
    opacity: 1,
    transition: {
      scale: {
        repeat: Infinity,
        duration: 1.5,
        ease: "easeInOut",
      },
    },
  },
};

// Stagger container
export const staggerContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Countdown number
export const countdownVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: [0, 1.2, 1],
    opacity: [0, 1, 1],
    transition: {
      duration: 0.5,
      times: [0, 0.6, 1],
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// Shake animation (for errors)
export const shakeVariants: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
    },
  },
};

/**
 * Reusable motion components
 */

export const MotionCard = motion.div;
export const MotionButton = motion.button;
export const MotionDiv = motion.div;

/**
 * Common transition presets
 */

export const springTransition = {
  type: "spring" as const,
  stiffness: 200,
  damping: 20,
};

export const smoothTransition = {
  duration: 0.3,
  ease: "easeOut" as const,
};

export const quickTransition = {
  duration: 0.15,
  ease: "easeInOut" as const,
};
