import React, { useState, useEffect } from 'react';
import './BotManagement.css';

interface BotAnalytics {
  bot_instance_id: string;
  display_name: string;
  behavior_profile: string;
  games_played: number;
  games_won: number;
  total_winnings: number;
  total_bet_amount: number;
  win_rate: number;
  roi: number;
  avg_bet_per_game: number;
  fold_rate: number;
  show_rate: number;
}

interface SystemOverview {
  total_bots: number;
  active_bots: number;
  total_games: number;
  total_winnings: number;
  avg_win_rate: number;
}

export const BotStatsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<BotAnalytics[]>([]);
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'games_played' | 'games_won' | 'total_winnings'>('games_played');
  const [limit, setLimit] = useState<number>(10);

  useEffect(() => {
    fetchAnalytics();
    fetchOverview();
  }, [sortBy, limit]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/bot-analytics?sortBy=${sortBy}&limit=${limit}`
      );
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics || []);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/bot-analytics/system/overview`
      );
      const data = await response.json();
      if (data.success) {
        setOverview(data.overview);
      }
    } catch (err) {
      console.error('Failed to fetch overview:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="bot-stats-dashboard">
      {/* System Overview */}
      {overview && (
        <div className="stats-overview">
          <h2>📊 System Overview</h2>
          <div className="overview-grid">
            <div className="overview-card">
              <div className="overview-icon">🤖</div>
              <div className="overview-content">
                <div className="overview-value">{overview.total_bots}</div>
                <div className="overview-label">Total Bots</div>
              </div>
            </div>

            <div className="overview-card">
              <div className="overview-icon">🟢</div>
              <div className="overview-content">
                <div className="overview-value">{overview.active_bots}</div>
                <div className="overview-label">Active Bots</div>
              </div>
            </div>

            <div className="overview-card">
              <div className="overview-icon">🎮</div>
              <div className="overview-content">
                <div className="overview-value">{overview.total_games}</div>
                <div className="overview-label">Total Games</div>
              </div>
            </div>

            <div className="overview-card">
              <div className="overview-icon">💰</div>
              <div className="overview-content">
                <div className="overview-value">{formatCurrency(overview.total_winnings)}</div>
                <div className="overview-label">Total Winnings</div>
              </div>
            </div>

            <div className="overview-card">
              <div className="overview-icon">📈</div>
              <div className="overview-content">
                <div className="overview-value">{formatPercentage(overview.avg_win_rate)}</div>
                <div className="overview-label">Avg Win Rate</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Controls */}
      <div className="stats-controls">
        <div className="control-group">
          <label>Sort By:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="games_played">Games Played</option>
            <option value="games_won">Games Won</option>
            <option value="total_winnings">Total Winnings</option>
          </select>
        </div>

        <div className="control-group">
          <label>Show:</label>
          <select value={limit} onChange={(e) => setLimit(parseInt(e.target.value))}>
            <option value="5">Top 5</option>
            <option value="10">Top 10</option>
            <option value="20">Top 20</option>
            <option value="50">Top 50</option>
          </select>
        </div>
      </div>

      {/* Analytics Table */}
      <div className="stats-table-container">
        <h2>🏆 Bot Performance</h2>
        {loading ? (
          <div className="loading">Loading analytics...</div>
        ) : analytics.length === 0 ? (
          <div className="empty-state">
            <p>No analytics data available yet.</p>
            <p className="hint">Bots need to play games to generate statistics.</p>
          </div>
        ) : (
          <table className="stats-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Bot Name</th>
                <th>Profile</th>
                <th>Games</th>
                <th>Wins</th>
                <th>Win Rate</th>
                <th>Winnings</th>
                <th>ROI</th>
                <th>Avg Bet</th>
                <th>Fold Rate</th>
                <th>Show Rate</th>
              </tr>
            </thead>
            <tbody>
              {analytics.map((bot, index) => (
                <tr key={bot.bot_instance_id}>
                  <td>{index + 1}</td>
                  <td className="bot-name-cell">
                    <div className="bot-name">{bot.display_name}</div>
                  </td>
                  <td>
                    <span className={`badge ${bot.behavior_profile}`}>
                      {bot.behavior_profile}
                    </span>
                  </td>
                  <td>{bot.games_played}</td>
                  <td>{bot.games_won}</td>
                  <td>
                    <span className={`win-rate ${bot.win_rate > 0.5 ? 'high' : 'low'}`}>
                      {formatPercentage(bot.win_rate)}
                    </span>
                  </td>
                  <td className={bot.total_winnings >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(bot.total_winnings)}
                  </td>
                  <td className={bot.roi >= 0 ? 'positive' : 'negative'}>
                    {formatPercentage(bot.roi)}
                  </td>
                  <td>{formatCurrency(bot.avg_bet_per_game)}</td>
                  <td>{formatPercentage(bot.fold_rate)}</td>
                  <td>{formatPercentage(bot.show_rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Performance Insights */}
      {analytics.length > 0 && (
        <div className="stats-insights">
          <h3>💡 Insights</h3>
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-title">Best Performer</div>
              <div className="insight-value">
                {analytics[0]?.display_name}
              </div>
              <div className="insight-subtitle">
                {analytics[0]?.games_won} wins in {analytics[0]?.games_played} games
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-title">Most Active</div>
              <div className="insight-value">
                {[...analytics].sort((a, b) => b.games_played - a.games_played)[0]?.display_name}
              </div>
              <div className="insight-subtitle">
                {[...analytics].sort((a, b) => b.games_played - a.games_played)[0]?.games_played} games played
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-title">Top Earner</div>
              <div className="insight-value">
                {[...analytics].sort((a, b) => b.total_winnings - a.total_winnings)[0]?.display_name}
              </div>
              <div className="insight-subtitle">
                {formatCurrency([...analytics].sort((a, b) => b.total_winnings - a.total_winnings)[0]?.total_winnings || 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotStatsDashboard;
