/**
 * Tailwind Demo Component
 * Shows various Tailwind utilities for the Teen Patti game
 * This is a demonstration file - delete after reviewing
 */

import { buttonStyles, cardStyles, playerStyles, bettingStyles, cn } from '../utils/tailwindClasses';

function TailwindDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-casino-green-dark to-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-casino-gold drop-shadow-glow animate-pulse-slow">
            🎰 Tailwind CSS Demo
          </h1>
          <p className="text-white text-lg">
            Pre-built utilities for your Teen Patti game
          </p>
        </div>

        {/* Buttons Section */}
        <section className="bg-gray-800 bg-opacity-90 rounded-xl p-6 border-2 border-casino-gold">
          <h2 className="text-2xl font-bold text-casino-gold mb-4">🎯 Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button className={buttonStyles.primary}>Primary (Bet)</button>
            <button className={buttonStyles.secondary}>Secondary</button>
            <button className={buttonStyles.gold}>Gold (Show)</button>
            <button className={buttonStyles.danger}>Danger (Fold)</button>
            <button className={buttonStyles.outline}>Outline</button>
            <button className={buttonStyles.disabled}>Disabled</button>
          </div>
        </section>

        {/* Cards Section */}
        <section className="bg-gray-800 bg-opacity-90 rounded-xl p-6 border-2 border-casino-gold">
          <h2 className="text-2xl font-bold text-casino-gold mb-4">🃏 Playing Cards</h2>
          <div className="flex gap-4">
            <div className={cn(cardStyles.playing, cardStyles.back)}>
              <div className="h-full flex items-center justify-center text-4xl">🎴</div>
            </div>
            <div className={cn(cardStyles.playingLarge, "bg-white flex items-center justify-center")}>
              <span className="text-4xl">A♠</span>
            </div>
            <div className={cn(cardStyles.playingLarge, "bg-white flex items-center justify-center")}>
              <span className="text-4xl text-red-600">K♥</span>
            </div>
            <div className={cn(cardStyles.playingLarge, "bg-white flex items-center justify-center")}>
              <span className="text-4xl text-red-600">Q♦</span>
            </div>
          </div>
        </section>

        {/* Player Cards */}
        <section className="bg-gray-800 bg-opacity-90 rounded-xl p-6 border-2 border-casino-gold">
          <h2 className="text-2xl font-bold text-casino-gold mb-4">👥 Players</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Active Player */}
            <div className={cn(playerStyles.container, playerStyles.active)}>
              <div className={playerStyles.avatar}>
                <span className="text-2xl">👤</span>
              </div>
              <div className={playerStyles.name}>Player 1</div>
              <div className={playerStyles.chips}>💰 $5,000</div>
              <div className="text-casino-gold text-xs font-bold">YOUR TURN</div>
            </div>

            {/* Inactive Player */}
            <div className={cn(playerStyles.container, playerStyles.inactive)}>
              <div className={playerStyles.avatar}>
                <span className="text-2xl">👤</span>
              </div>
              <div className={playerStyles.name}>Player 2</div>
              <div className={playerStyles.chips}>💰 $3,500</div>
            </div>

            {/* Folded Player */}
            <div className={cn(playerStyles.container, playerStyles.inactive, playerStyles.folded)}>
              <div className={playerStyles.avatar}>
                <span className="text-2xl">👤</span>
              </div>
              <div className={playerStyles.name}>Player 3</div>
              <div className={playerStyles.chips}>💰 $0</div>
              <div className="text-red-500 text-xs font-bold">FOLDED</div>
            </div>
          </div>
        </section>

        {/* Betting Chips */}
        <section className="bg-gray-800 bg-opacity-90 rounded-xl p-6 border-2 border-casino-gold">
          <h2 className="text-2xl font-bold text-casino-gold mb-4">🪙 Betting Chips</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <div className={cn(bettingStyles.chip, bettingStyles.chipValues[10])}>
              10
            </div>
            <div className={cn(bettingStyles.chip, bettingStyles.chipValues[20])}>
              20
            </div>
            <div className={cn(bettingStyles.chip, bettingStyles.chipValues[50])}>
              50
            </div>
            <div className={cn(bettingStyles.chip, bettingStyles.chipValues[100])}>
              100
            </div>
            <div className={cn(bettingStyles.chip, bettingStyles.chipValues[500])}>
              500
            </div>
          </div>
        </section>

        {/* Pot Display */}
        <section className="bg-gray-800 bg-opacity-90 rounded-xl p-6 border-2 border-casino-gold">
          <h2 className="text-2xl font-bold text-casino-gold mb-4">💰 Pot Display</h2>
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 text-white font-bold text-3xl py-6 px-12 rounded-full shadow-glow animate-pulse-slow">
              Pot: $12,500
            </div>
          </div>
        </section>

        {/* Animations */}
        <section className="bg-gray-800 bg-opacity-90 rounded-xl p-6 border-2 border-casino-gold">
          <h2 className="text-2xl font-bold text-casino-gold mb-4">✨ Animations</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="bg-red-600 text-white px-6 py-3 rounded-lg animate-pulse">
              Pulse
            </div>
            <div className="bg-green-600 text-white px-6 py-3 rounded-lg animate-bounce">
              Bounce
            </div>
            <div className={cn(bettingStyles.chip, "bg-yellow-600 text-white")}>
              Chip Toss
            </div>
            <div className="bg-blue-600 text-white px-6 py-3 rounded-lg animate-card-deal">
              Card Deal
            </div>
          </div>
        </section>

        {/* Responsive Grid */}
        <section className="bg-gray-800 bg-opacity-90 rounded-xl p-6 border-2 border-casino-gold">
          <h2 className="text-2xl font-bold text-casino-gold mb-4">📱 Responsive Grid</h2>
          <p className="text-gray-300 mb-4 text-sm">Resize your browser to see it adapt!</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <div key={num} className="bg-casino-green p-6 rounded-lg text-white text-center font-bold">
                Card {num}
              </div>
            ))}
          </div>
        </section>

        {/* Utility Classes */}
        <section className="bg-gray-800 bg-opacity-90 rounded-xl p-6 border-2 border-casino-gold">
          <h2 className="text-2xl font-bold text-casino-gold mb-4">🎨 Common Utilities</h2>
          <div className="space-y-3 text-white">
            <div className="flex items-center gap-3">
              <code className="bg-gray-900 px-3 py-1 rounded text-casino-gold">bg-casino-green</code>
              <div className="w-20 h-8 bg-casino-green rounded"></div>
            </div>
            <div className="flex items-center gap-3">
              <code className="bg-gray-900 px-3 py-1 rounded text-casino-gold">bg-casino-gold</code>
              <div className="w-20 h-8 bg-casino-gold rounded"></div>
            </div>
            <div className="flex items-center gap-3">
              <code className="bg-gray-900 px-3 py-1 rounded text-casino-gold">shadow-glow</code>
              <div className="w-20 h-8 bg-casino-gold rounded shadow-glow"></div>
            </div>
            <div className="flex items-center gap-3">
              <code className="bg-gray-900 px-3 py-1 rounded text-casino-gold">hover:scale-110</code>
              <button className="bg-red-600 text-white px-4 py-2 rounded transition-transform hover:scale-110">
                Hover Me
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-gray-400 space-y-2 pb-8">
          <p>✅ Tailwind CSS is fully configured!</p>
          <p className="text-sm">
            Check <code className="bg-gray-800 px-2 py-1 rounded text-casino-gold">TAILWIND_GUIDE.md</code> for documentation
          </p>
          <p className="text-sm">
            See <code className="bg-gray-800 px-2 py-1 rounded text-casino-gold">src/utils/tailwindClasses.ts</code> for utility classes
          </p>
        </div>
      </div>
    </div>
  );
}

export default TailwindDemo;
