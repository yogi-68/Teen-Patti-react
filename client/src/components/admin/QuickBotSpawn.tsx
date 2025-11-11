import React, { useState, useEffect } from 'react';
import './BotManagement.css';

interface ActiveBot {
  socket_id: string;
  bot_instance_id: string;
  table_id: number;
  display_name: string;
  chips: number;
  connected: boolean;
}

interface ActiveTable {
  id: number;
  gameMode: string;
  players: number;
  maxPlayers: number;
  gameState: string;
  pot: number;
  playerNames: string[];
}

export const QuickBotSpawn: React.FC = () => {
  const [tableId, setTableId] = useState('1');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeBots, setActiveBots] = useState<ActiveBot[]>([]);
  const [activeTables, setActiveTables] = useState<ActiveTable[]>([]);

  useEffect(() => {
    fetchActiveBots();
    fetchActiveTables();
    // Refresh every 5 seconds
    const interval = setInterval(() => {
      fetchActiveBots();
      fetchActiveTables();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveBots = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/test/bots/active`);
      const data = await response.json();
      if (data.success) {
        setActiveBots(data.bots || []);
      }
    } catch (err) {
      console.error('Error fetching active bots:', err);
    }
  };

  const fetchActiveTables = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/test/tables/active`);
      const data = await response.json();
      if (data.success) {
        setActiveTables(data.tables || []);
      }
    } catch (err) {
      console.error('Error fetching active tables:', err);
    }
  };

  const handleSpawnBot = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/test/bots/spawn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: parseInt(tableId),
          displayName: displayName.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to spawn bot');
      }

      setSuccess(`Bot "${data.bot.display_name}" spawned and joined table ${data.bot.table_id}!`);
      setDisplayName('');
      fetchActiveBots();
    } catch (err: any) {
      setError(err.message || 'Failed to spawn bot');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBot = async (socketId: string, botName: string) => {
    if (!confirm(`Remove bot "${botName}" from the game?`)) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/test/bots/remove/${socketId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to remove bot');
      }

      setSuccess(`Bot "${botName}" removed successfully!`);
      fetchActiveBots();
    } catch (err: any) {
      setError(err.message || 'Failed to remove bot');
    }
  };

  return (
    <div className="quick-bot-spawn">
      <div className="spawn-section">
        <h2>⚡ Quick Spawn Bot</h2>
        <p className="spawn-description">
          Instantly spawn a bot and add it to an active game table. The bot will automatically play when it's their turn.
        </p>

        <div className="spawn-form">
          <div className="form-group">
            <label>Table ID:</label>
            <input
              type="text"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              placeholder="1"
            />
            <small>Enter the table ID where you want the bot to join (e.g., 1 for coins, 20001 for cash)</small>
          </div>

          <div className="form-group">
            <label>Bot Name (optional):</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Leave empty for random name"
            />
            <small>Custom name for the bot, or leave empty for a randomly generated name</small>
          </div>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              ✅ {success}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handleSpawnBot}
            disabled={loading || !tableId}
          >
            {loading ? '⏳ Spawning Bot...' : '🤖 Spawn Bot'}
          </button>
        </div>
      </div>

      <div className="active-tables-section">
        <h2>📊 Active Tables ({activeTables.length})</h2>
        
        {activeTables.length === 0 ? (
          <div className="empty-state">
            <p>No active tables with players right now.</p>
          </div>
        ) : (
          <div className="active-tables-grid">
            {activeTables.map((table) => (
              <div key={table.id} className="active-table-card">
                <div className="table-card-header">
                  <h4>🎲 Table #{table.id}</h4>
                  <span className="game-mode-badge">{table.gameMode}</span>
                </div>
                <div className="table-card-body">
                  <div className="table-info-row">
                    <span className="label">Players:</span>
                    <span className="value">{table.players}/{table.maxPlayers}</span>
                  </div>
                  <div className="table-info-row">
                    <span className="label">State:</span>
                    <span className="value">{table.gameState}</span>
                  </div>
                  <div className="table-info-row">
                    <span className="label">Pot:</span>
                    <span className="value">₹{table.pot}</span>
                  </div>
                  <div className="table-players">
                    <span className="label">Players:</span>
                    <div className="player-names">
                      {table.playerNames.map((name, idx) => (
                        <span key={idx} className="player-name">{name}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="table-card-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setTableId(table.id.toString())}
                  >
                    📍 Select This Table
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="active-bots-section">
        <h2>🎮 Active Bots in Games ({activeBots.length})</h2>
        
        {activeBots.length === 0 ? (
          <div className="empty-state">
            <p>No active bots in games right now.</p>
            <p className="hint">Use the form above to spawn a bot and add it to a table!</p>
          </div>
        ) : (
          <div className="active-bots-grid">
            {activeBots.map((bot) => (
              <div key={bot.socket_id} className="active-bot-card">
                <div className="bot-card-header">
                  <h4>🤖 {bot.display_name}</h4>
                  <span className={`status-badge ${bot.connected ? 'connected' : 'disconnected'}`}>
                    {bot.connected ? '🟢 Active' : '🔴 Offline'}
                  </span>
                </div>
                <div className="bot-card-body">
                  <div className="bot-info-row">
                    <span className="label">Table:</span>
                    <span className="value">#{bot.table_id}</span>
                  </div>
                  <div className="bot-info-row">
                    <span className="label">Chips:</span>
                    <span className="value">₹{bot.chips}</span>
                  </div>
                  <div className="bot-info-row">
                    <span className="label">Socket ID:</span>
                    <span className="value small">{bot.socket_id.substring(0, 20)}...</span>
                  </div>
                </div>
                <div className="bot-card-actions">
                  <button
                    className="btn-danger"
                    onClick={() => handleRemoveBot(bot.socket_id, bot.display_name)}
                  >
                    🗑️ Remove from Game
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickBotSpawn;
