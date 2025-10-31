import './LeaderboardPage.css';

const LeaderboardPage = () => {
  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h1>🏆 Leaderboard</h1>
        <p>Top players of the week</p>
      </div>
      
      <div className="coming-soon">
        <div className="coming-soon-icon">🏆</div>
        <h2>Leaderboard Coming Soon!</h2>
        <p>Track the best players and compete for the top spot.</p>
        <p>Features:</p>
        <ul>
          <li>🥇 Top 100 players ranking</li>
          <li>💎 Win streaks and achievements</li>
          <li>📈 Weekly and all-time rankings</li>
          <li>🎁 Rewards for top performers</li>
        </ul>
      </div>
    </div>
  );
};

export default LeaderboardPage;
