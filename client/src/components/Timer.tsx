import './Timer.css';

interface TimerProps {
  playerId: string;
  timeLeft: number;
  small?: boolean;
}

function Timer({ timeLeft, small = false }: TimerProps) {
  const getTimerColor = () => {
    if (timeLeft <= 5) return 'timer-critical';
    if (timeLeft <= 10) return 'timer-warning';
    return 'timer-normal';
  };

  const getProgressPercentage = () => {
    return (timeLeft / 20) * 100;
  };

  return (
    <div className={`timer ${getTimerColor()} ${small ? 'timer-small' : ''}`}>
      <div className="timer-display">
        <span className="timer-icon">⏱️</span>
        <span className="timer-value">{timeLeft}s</span>
      </div>
      <div className="timer-progress-bar">
        <div
          className="timer-progress"
          style={{ width: `${getProgressPercentage()}%` }}
        ></div>
      </div>
    </div>
  );
}

export default Timer;
