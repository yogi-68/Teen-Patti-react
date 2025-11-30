import React, { useState, useEffect } from 'react';
import Joyride, { type Step, type State as JoyrideState } from 'react-joyride';

interface GameplayTourProps {
  runTour: boolean;
  onTourEnd: () => void;
  gameMode: 'practice' | 'token';
}

const GameplayTour: React.FC<GameplayTourProps> = ({ runTour, onTourEnd, gameMode }) => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    console.log('🎮 GameplayTour received runTour:', runTour);
    if (runTour) {
      // Small delay to ensure DOM is ready
      console.log('🎮 GameplayTour will start in 800ms');
      setTimeout(() => {
        console.log('🎮 GameplayTour starting now!');
        setRun(true);
      }, 800);
    }
  }, [runTour]);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', color: '#ffd700' }}>🎮 Welcome to Teen Patti!</h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
            This tutorial will guide you through everything you need to know to play Teen Patti.
          </p>
          <p style={{ fontSize: '1rem', marginTop: '0.8rem' }}>
            You're playing in <strong>{gameMode === 'token' ? '💰 Token Mode' : '🪙 Trial/Practice Mode'}</strong>
          </p>
          <p style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '0.8rem' }}>
            💡 Take your time - you can go back or skip anytime
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', color: '#ffd700' }}>🎯 What is Teen Patti?</h2>
          <div style={{ textAlign: 'left', fontSize: '0.95rem', lineHeight: '1.7' }}>
            <p>Teen Patti (meaning "three cards" in Hindi) is a popular Indian card game similar to poker.</p>
            <br />
            <p><strong>The Goal:</strong> Win the pot by having the best 3-card hand or by making other players fold.</p>
            <br />
            <p><strong>How to Win:</strong></p>
            <ul style={{ marginLeft: '1.2rem', marginTop: '0.5rem' }}>
              <li>Have the <strong>highest ranking hand</strong> when cards are revealed</li>
              <li>Make all other players <strong>fold</strong> through smart betting</li>
              <li>Successfully <strong>bluff</strong> your way to victory!</li>
            </ul>
          </div>
        </div>
      ),
      placement: 'center',
    },
    {
      target: '.table-info',
      content: (
        <div>
          <h3 style={{ color: '#ffd700', marginBottom: '0.5rem' }}>📊 Table Information</h3>
          <p>
            This shows important game details:
            <br />
            <strong>• Pot:</strong> Total amount up for grabs
            <br />
            <strong>• Boot Amount:</strong> Initial bet to join
            <br />
            <strong>• Min/Max Bet:</strong> Betting limits
            <br />
            <strong>• Players:</strong> Current players at table
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.player-card',
      content: (
        <div>
          <h3 style={{ color: '#ffd700', marginBottom: '0.5rem' }}>👥 Player Cards</h3>
          <p>
            Each player's position shows:
            <br />
            <strong>• Name & Balance:</strong> Player identity and chips
            <br />
            <strong>• Cards:</strong> Face down until shown or game ends
            <br />
            <strong>• Status:</strong> Active, folded, or waiting
            <br />
            <strong>• Turn Indicator:</strong> Green glow when it's their turn
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.playing-card',
      content: (
        <div>
          <h3 style={{ color: '#ffd700', marginBottom: '0.5rem' }}>🎴 Your Cards</h3>
          <p>
            You start with <strong>3 cards</strong> face down.
            <br />
            <br />
            <strong>Important:</strong> You can play "blind" (without seeing cards) for half the bet amount, or click to see your cards and play normally.
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.betting-panel',
      content: (
        <div>
          <h3 style={{ color: '#ffd700', marginBottom: '0.5rem' }}>💰 Betting Panel</h3>
          <p>
            This is your action center during the game. Different buttons appear based on game state:
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.btn-see',
      content: (
        <div>
          <h3 style={{ color: '#ffd700', marginBottom: '0.5rem' }}>👁️ See Cards Button</h3>
          <p>
            <strong>Click to view your cards.</strong>
            <br />
            <br />
            ⚠️ Once you see cards, your bets will cost <strong>DOUBLE</strong> compared to playing blind.
            <br />
            <br />
            💡 <em>Strategy tip: Playing blind can intimidate opponents!</em>
          </p>
        </div>
      ),
      placement: 'top',
      spotlightClicks: false,
    },
    {
      target: 'body',
      content: (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', color: '#ffd700' }}>🎯 Betting Actions</h2>
          <div style={{ textAlign: 'left', fontSize: '0.95rem', lineHeight: '1.6' }}>
            <p><strong>When it's your turn, you can:</strong></p>
            <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
              <li><strong>🎲 Chaal (Play):</strong> Match or raise the current bet (after seeing cards)</li>
              <li><strong>🎭 Blind:</strong> Bet without seeing cards - costs 50% less!</li>
              <li><strong>🏳️ Fold:</strong> Give up your hand and sit out this round</li>
              <li><strong>⚔️ Show:</strong> Challenge opponent to compare hands (only with 2 players left)</li>
              <li><strong>🎰 Side Show:</strong> Request to compare cards with previous player</li>
            </ul>
          </div>
        </div>
      ),
      placement: 'center',
    },
    {
      target: 'body',
      content: (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', color: '#ffd700' }}>⏱️ Turn Timer</h2>
          <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>
            You have <strong>20 seconds</strong> to make your move.
            <br />
            <br />
            If time runs out, you'll automatically <strong>fold</strong>.
            <br />
            <br />
            A countdown timer and progress bar will show your remaining time.
          </p>
        </div>
      ),
      placement: 'center',
    },
    {
      target: 'body',
      content: (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', color: '#ffd700' }}>🏆 Winning the Game</h2>
          <div style={{ textAlign: 'left', fontSize: '0.95rem', lineHeight: '1.7' }}>
            <p><strong>You win by:</strong></p>
            <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
              <li>Being the <strong>last player standing</strong> (everyone else folded)</li>
              <li>Having the <strong>best hand</strong> when cards are shown</li>
              <li>Successfully <strong>bluffing</strong> opponents into folding</li>
            </ul>
            <br />
            <p><strong>Hand Rankings (Best to Worst):</strong></p>
            <ol style={{ marginLeft: '1rem', fontSize: '0.9rem' }}>
              <li>Trail (AAA, KKK, etc.)</li>
              <li>Pure Sequence (A-K-Q same suit)</li>
              <li>Sequence (A-K-Q different suits)</li>
              <li>Color/Flush (all same suit)</li>
              <li>Pair (JJ, 55, etc.)</li>
              <li>High Card</li>
            </ol>
          </div>
        </div>
      ),
      placement: 'center',
    },
    {
      target: 'body',
      content: (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', color: '#ffd700' }}>💡 Pro Tips</h2>
          <div style={{ textAlign: 'left', fontSize: '0.95rem', lineHeight: '1.7' }}>
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              <li>✅ <strong>Start by playing blind</strong> - Save chips early on</li>
              <li>✅ <strong>Watch opponents' betting patterns</strong> - Learn their tells</li>
              <li>✅ <strong>Bluff strategically</strong> - Don't overdo it!</li>
              <li>✅ <strong>Know when to fold</strong> - Weak hands aren't worth chasing</li>
              <li>✅ <strong>Manage your bankroll</strong> - Don't bet more than you can afford</li>
              <li>✅ <strong>Practice makes perfect</strong> - Use practice mode to learn</li>
            </ul>
          </div>
        </div>
      ),
      placement: 'center',
    },
    {
      target: 'body',
      content: (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', color: '#ffd700' }}>🎉 Ready to Play!</h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            You now know all the basics of Teen Patti!
          </p>
          <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>
            Wait for the game to start, and when it's your turn, the betting panel will light up.
            <br />
            <br />
            <strong>Good luck and have fun! 🍀</strong>
          </p>
          <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '1rem' }}>
            You can restart this tutorial anytime from Settings
          </p>
        </div>
      ),
      placement: 'center',
    },
  ];

  const handleJoyrideCallback = (data: JoyrideState) => {
    const { status } = data;
    const finishedStatuses: string[] = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      onTourEnd();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: '#1a1f2e',
          backgroundColor: '#1a1f2e',
          overlayColor: 'rgba(0, 0, 0, 0.85)',
          primaryColor: '#ffd700',
          textColor: '#ffffff',
          width: 480,
          zIndex: 10000,
        },
        buttonNext: {
          backgroundColor: '#ffd700',
          color: '#1a1f2e',
          fontWeight: 'bold',
        },
        buttonBack: {
          color: '#ffd700',
        },
        buttonSkip: {
          color: '#888',
        },
      }}
      locale={{
        back: '← Back',
        close: 'Close',
        last: 'Start Playing!',
        next: 'Next →',
        skip: 'Skip Tutorial',
      }}
    />
  );
};

export default GameplayTour;
