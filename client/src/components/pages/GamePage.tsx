import './GamePage.css';

const GamePage = () => {
  return (
    <div className="game-page">
      <div className="page-header">
        <h1>🎮 Play Teen Patti</h1>
        <p>Join a table and start playing!</p>
      </div>
      
      <div className="coming-soon">
        <div className="coming-soon-icon">🎴</div>
        <h2>Game Coming Soon!</h2>
        <p>The live game feature is under development.</p>
        <p>You'll be able to:</p>
        <ul>
          <li>🎲 Join multiplayer tables</li>
          <li>💰 Play with coins or real money</li>
          <li>🎯 Real-time gameplay with other players</li>
          <li>📊 Track your game statistics</li>
        </ul>
      </div>
    </div>
  );
};

export default GamePage;
