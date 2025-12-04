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
    if (runTour) {
      setTimeout(() => {
        setRun(true);
      }, 500);
    }
  }, [runTour]);

  const steps: Step[] = [
    {
      target: '.game-card',
      content: (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', color: '#ffd700' }}>🎮 Welcome to Teen Patti!</h2>
          <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>
            Click here to select a game mode and start playing!
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', color: '#ffd700' }}>🎯 Game Modes</h2>
          <div style={{ textAlign: 'left', fontSize: '0.95rem', lineHeight: '1.7' }}>
            <p><strong>🪙 Trial Mode:</strong> Practice with free trial coins</p>
            <p style={{ marginTop: '0.5rem' }}><strong>💰 Token Mode:</strong> Play with real tokens (requires subscription)</p>
            <p style={{ marginTop: '1rem', color: '#ffd700' }}>Start with Trial Mode to learn!</p>
          </div>
        </div>
      ),
      placement: 'center',
    },
    {
      target: 'body',
      content: (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', color: '#ffd700' }}>🃏 Hand Rankings</h2>
          <div style={{ textAlign: 'left', fontSize: '0.9rem', lineHeight: '1.5' }}>
            <p><strong>1. Trail:</strong> 3 same cards (A-A-A)</p>
            <p><strong>2. Pure Sequence:</strong> Consecutive, same suit</p>
            <p><strong>3. Sequence:</strong> Consecutive cards</p>
            <p><strong>4. Color:</strong> Same suit</p>
            <p><strong>5. Pair:</strong> 2 same cards</p>
            <p><strong>6. High Card:</strong> Highest card wins</p>
          </div>
        </div>
      ),
      placement: 'center',
    },
    {
      target: 'body',
      content: (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', color: '#ffd700' }}>💰 How to Play</h2>
          <div style={{ textAlign: 'left', fontSize: '0.95rem', lineHeight: '1.6' }}>
            <p><strong>Actions on your turn:</strong></p>
            <ul style={{ marginLeft: '1.2rem', marginTop: '0.5rem' }}>
              <li><strong>Chaal:</strong> Bet to stay in</li>
              <li><strong>Pack:</strong> Fold your cards</li>
              <li><strong>Show:</strong> Compare hands (2 players left)</li>
              <li><strong>See Cards:</strong> View your cards (doubles bet)</li>
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
          <h2 style={{ marginBottom: '1rem', color: '#ffd700' }}>✨ Ready to Play!</h2>
          <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>
            Select your game mode and join a table!
          </p>
          <p style={{ fontSize: '0.9rem', color: '#ffd700', marginTop: '1rem' }}>
            Good luck! 🎯
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
