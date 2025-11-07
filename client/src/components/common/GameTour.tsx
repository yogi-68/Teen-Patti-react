import React, { useState, useEffect } from 'react';
import Joyride, { type Step, type State as JoyrideState } from 'react-joyride';

interface GameTourProps {
  runTour: boolean;
  onTourEnd: () => void;
}

const GameTour: React.FC<GameTourProps> = ({ runTour, onTourEnd }) => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (runTour) {
      // Small delay to ensure DOM is ready
      setTimeout(() => setRun(true), 500);
    }
  }, [runTour]);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', color: '#ffd700' }}>🎴 Welcome to Teen Patti!</h2>
          <p style={{ fontSize: '1.1rem' }}>
            Let's take a quick tour to help you get started with India's most exciting card game!
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.nav-brand',
      content: (
        <div>
          <h3 style={{ color: '#ffd700', marginBottom: '0.5rem' }}>🏠 Home Navigation</h3>
          <p>Click the Teen Patti logo anytime to return to your dashboard.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.user-info',
      content: (
        <div>
          <h3 style={{ color: '#ffd700', marginBottom: '0.5rem' }}>👤 Your Profile</h3>
          <p>
            Here you can see your username and balances:
            <br />
            <strong>🪙 Practice Coins:</strong> Free coins for practice games
            <br />
            <strong>💰 Real Money:</strong> Available after subscription for cash games
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: 'a[href="/profile"]',
      content: (
        <div>
          <h3 style={{ color: '#ffd700', marginBottom: '0.5rem' }}>👤 Profile Page</h3>
          <p>
            Manage your account, view stats, and upgrade to premium subscription for real money games.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: 'a[href="/wallet"]',
      content: (
        <div>
          <h3 style={{ color: '#ffd700', marginBottom: '0.5rem' }}>💰 Wallet</h3>
          <p>
            Request deposits, withdrawals, and view your transaction history. 
            <br />
            <strong>Note:</strong> All transactions are manually processed by admins for security.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: 'a[href="/game"]',
      content: (
        <div>
          <h3 style={{ color: '#ffd700', marginBottom: '0.5rem' }}>🎮 Play Game</h3>
          <p>
            <strong>This is where the magic happens!</strong>
            <br />
            Choose between:
            <br />
            • <strong>Practice Mode:</strong> Play with free coins, perfect for learning
            <br />
            • <strong>Cash Mode:</strong> Real money games (requires subscription)
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: 'a[href="/settings"]',
      content: (
        <div>
          <h3 style={{ color: '#ffd700', marginBottom: '0.5rem' }}>⚙️ Settings</h3>
          <p>
            Change your email address or password to keep your account secure.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: 'body',
      content: (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', color: '#ffd700' }}>🎯 Game Rules - Quick Guide</h2>
          <div style={{ textAlign: 'left', fontSize: '0.95rem', lineHeight: '1.6' }}>
            <p><strong>🎴 How to Play:</strong></p>
            <ul style={{ marginLeft: '1rem' }}>
              <li>Each player gets 3 cards</li>
              <li>Bet blindly or see your cards (costs double)</li>
              <li>Match or raise the pot to stay in</li>
              <li>Request a "show" to compare cards with another player</li>
              <li>Best hand wins the pot!</li>
            </ul>
            <br />
            <p><strong>🏆 Hand Rankings (Best to Worst):</strong></p>
            <ol style={{ marginLeft: '1rem' }}>
              <li><strong>Trail (Three of a Kind)</strong> - AAA, KKK, etc.</li>
              <li><strong>Pure Sequence</strong> - A-K-Q of same suit</li>
              <li><strong>Sequence (Run)</strong> - A-K-Q of different suits</li>
              <li><strong>Color (Flush)</strong> - Any 3 cards of same suit</li>
              <li><strong>Pair</strong> - Two cards of same rank</li>
              <li><strong>High Card</strong> - Highest card wins</li>
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
          <div style={{ textAlign: 'left', fontSize: '1rem', lineHeight: '1.8' }}>
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              <li>✅ <strong>Start with Practice Mode</strong> - Master the game risk-free</li>
              <li>✅ <strong>Watch Your Bankroll</strong> - Don't bet more than you can afford</li>
              <li>✅ <strong>Bluff Strategically</strong> - Confidence can win pots!</li>
              <li>✅ <strong>Know When to Fold</strong> - Save coins for better hands</li>
              <li>✅ <strong>Play Responsibly</strong> - Set limits and take breaks</li>
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
          <h2 style={{ marginBottom: '1rem', color: '#ffd700' }}>🎉 You're All Set!</h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            Ready to play? Click on the <strong>Play Game</strong> tab to choose your mode and join a table!
          </p>
          <p style={{ fontSize: '0.95rem', color: '#888' }}>
            You can restart this tour anytime from your settings.
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
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          primaryColor: '#ffd700',
          textColor: '#ffffff',
          width: 450,
          zIndex: 10000,
        },
      }}
      locale={{
        back: '← Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next →',
        skip: 'Skip Tour',
      }}
    />
  );
};

export default GameTour;
