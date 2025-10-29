import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import PlayingCard from './PlayingCard';
import Chip from './Chip';
import AnimatedButton from './AnimatedButton';
import {
  cardDealVariants,
  winnerVariants,
  countdownVariants,
  shakeVariants,
  potPulseVariants,
  slideUpVariants,
  staggerContainerVariants,
} from '../utils/animations';
import type { Card } from '../types/game.types';

function FramerMotionDemo() {
  const [showCards, setShowCards] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  const demoCards: Card[] = [
    { type: 'heart', rank: 14, name: 'A', priority: 1 },
    { type: 'spade', rank: 13, name: 'K', priority: 2 },
    { type: 'diamond', rank: 12, name: 'Q', priority: 3 },
  ];

  const chipValues = [10, 20, 50, 100, 500];

  const handleCountdown = () => {
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      if (count === 0) {
        clearInterval(interval);
        setCountdown(null);
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-casino-green-dark to-gray-900 p-8">
      <motion.div
        className="max-w-6xl mx-auto space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.h1
          className="text-5xl font-bold text-center text-casino-gold drop-shadow-glow"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          🎬 Framer Motion Demo
        </motion.h1>

        {/* Card Deal Animation */}
        <section className="bg-gray-800 bg-opacity-90 rounded-xl p-6 border-2 border-casino-gold">
          <h2 className="text-2xl font-bold text-casino-gold mb-4">🃏 Card Deal Animation</h2>
          <div className="flex gap-4 mb-4 justify-center">
            <AnimatedButton onClick={() => setShowCards(!showCards)} variant="gold">
              {showCards ? 'Hide' : 'Deal'} Cards
            </AnimatedButton>
          </div>
          <AnimatePresence mode="wait">
            {showCards && (
              <motion.div
                className="flex gap-4 justify-center"
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                {demoCards.map((card, index) => (
                  <PlayingCard key={index} card={card} index={index} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Chip Animation */}
        <section className="bg-gray-800 bg-opacity-90 rounded-xl p-6 border-2 border-casino-gold">
          <h2 className="text-2xl font-bold text-casino-gold mb-4">🪙 Chip Toss Animation</h2>
          <div className="flex gap-4 justify-center flex-wrap">
            {chipValues.map((value, index) => (
              <Chip
                key={value}
                value={value}
                index={index}
                onClick={() => console.log(`Bet $${value}`)}
              />
            ))}
          </div>
        </section>

        {/* Button Animations */}
        <section className="bg-gray-800 bg-opacity-90 rounded-xl p-6 border-2 border-casino-gold">
          <h2 className="text-2xl font-bold text-casino-gold mb-4">🎯 Button Animations</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <AnimatedButton variant="primary">Bet</AnimatedButton>
            <AnimatedButton variant="secondary">Call</AnimatedButton>
            <AnimatedButton variant="gold">Show</AnimatedButton>
            <AnimatedButton variant="danger">Fold</AnimatedButton>
            <AnimatedButton variant="success">Win!</AnimatedButton>
            <AnimatedButton disabled>Disabled</AnimatedButton>
          </div>
        </section>

        {/* Countdown Animation */}
        <section className="bg-gray-800 bg-opacity-90 rounded-xl p-6 border-2 border-casino-gold">
          <h2 className="text-2xl font-bold text-casino-gold mb-4">⏱️ Countdown Animation</h2>
          <div className="flex flex-col items-center gap-4">
            <AnimatedButton onClick={handleCountdown} variant="gold">
              Start Countdown
            </AnimatedButton>
            <div className="h-32 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {countdown !== null && (
                  <motion.div
                    key={countdown}
                    className="text-8xl font-bold text-casino-gold"
                    variants={countdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {countdown}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Winner Celebration */}
        <section className="bg-gray-800 bg-opacity-90 rounded-xl p-6 border-2 border-casino-gold">
          <h2 className="text-2xl font-bold text-casino-gold mb-4">🏆 Winner Celebration</h2>
          <div className="flex flex-col items-center gap-4">
            <AnimatedButton onClick={() => setShowWinner(!showWinner)} variant="success">
              {showWinner ? 'Hide' : 'Show'} Winner
            </AnimatedButton>
            <AnimatePresence>
              {showWinner && (
                <motion.div
                  className="text-6xl"
                  variants={winnerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  🏆 WINNER! 🏆
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Pot Pulse */}
        <section className="bg-gray-800 bg-opacity-90 rounded-xl p-6 border-2 border-casino-gold">
          <h2 className="text-2xl font-bold text-casino-gold mb-4">💰 Pot Pulse Animation</h2>
          <div className="flex justify-center">
            <motion.div
              className="bg-gradient-to-br from-yellow-600 to-yellow-700 text-white font-bold text-3xl py-6 px-12 rounded-full shadow-glow"
              variants={potPulseVariants}
              initial="idle"
              animate="pulse"
              whileHover={{ scale: 1.1 }}
            >
              Pot: $12,500
            </motion.div>
          </div>
        </section>

        {/* Shake Animation (Error) */}
        <section className="bg-gray-800 bg-opacity-90 rounded-xl p-6 border-2 border-casino-gold">
          <h2 className="text-2xl font-bold text-casino-gold mb-4">⚠️ Shake Animation (Error)</h2>
          <div className="flex flex-col items-center gap-4">
            <AnimatedButton onClick={() => setShakeTrigger(prev => prev + 1)} variant="danger">
              Trigger Error
            </AnimatedButton>
            <motion.div
              className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg"
              variants={shakeVariants}
              animate={shakeTrigger > 0 ? "shake" : undefined}
            >
              ❌ Not enough chips!
            </motion.div>
          </div>
        </section>

        {/* Slide Up Animation */}
        <motion.section
          className="bg-gray-800 bg-opacity-90 rounded-xl p-6 border-2 border-casino-gold"
          variants={slideUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-casino-gold mb-4">⬆️ Slide Up on Scroll</h2>
          <p className="text-white">This section slides up when it comes into view!</p>
        </motion.section>

        {/* Footer */}
        <motion.div
          className="text-center text-gray-400 space-y-2 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-casino-gold font-bold text-xl">✅ Framer Motion Installed!</p>
          <p>All animations are ready to use in your game components.</p>
          <p className="text-sm">
            Import from: <code className="bg-gray-800 px-2 py-1 rounded">src/utils/animations.ts</code>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default FramerMotionDemo;
