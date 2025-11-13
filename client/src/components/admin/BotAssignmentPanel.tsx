import React, { useState, useEffect } from 'react';
import './BotManagement.css';

interface Player {
  playerId: string;
  userName: string;
  isBot: boolean;
  chips: number;
  hasFolded: boolean;
}

interface ActiveTable {
  id: number;
  gameMode: string;
  playerCount: number;
  maxPlayers: number;
  gameState: string;
  pot: number;
  currentBet: number;
  activePlayers: number;
  players: Player[];
}

export const BotAssignmentPanel: React.FC = () => {
  const [tableId, setTableId] = useState('1');
  const [displayName, setDisplayName] = useState('');
  const [behaviorProfile, setBehaviorProfile] = useState<'aggressive' | 'conservative' | 'balanced'>('balanced');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTables, setActiveTables] = useState<ActiveTable[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);

  useEffect(() => {
    fetchActiveTables();
    // Refresh active tables every 5 seconds
    const interval = setInterval(fetchActiveTables, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveTables = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/test/tables/active`);
      const data = await response.json();
      
      if (data.success && data.tables) {
        setActiveTables(data.tables);
      }
    } catch (err) {
      console.error('Failed to fetch active tables:', err);
    } finally {
      setLoadingTables(false);
    }
  };

  const handleSpawnBot = async () => {
    if (!tableId) {
      setError('Please enter a table ID');
      return;
    }

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
          behaviorProfile: behaviorProfile, // Send behavior profile to server
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to spawn bot');
      }

      setSuccess(`Bot "${data.bot.display_name}" spawned and joined table ${data.bot.table_id}!`);
      setDisplayName('');
      fetchActiveTables(); // Refresh tables to show new bot
    } catch (err: any) {
      setError(err.message || 'Failed to spawn bot');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBot = async (playerId: string, playerName: string, tableId: number) => {
    if (!confirm(`Remove ${playerName} from Table ${tableId}? The bot will fold their cards and leave the game.`)) {
      return;
    }

    try {
      // Get active bots to find socket ID
      const activeBotsResponse = await fetch(`${import.meta.env.VITE_API_URL}/test/bots/active`);
      const activeBotsData = await activeBotsResponse.json();
      
      if (!activeBotsData.success || !activeBotsData.bots) {
        alert('Failed to fetch active bots');
        return;
      }

      // Find the bot's socket ID by checking if the player ID matches a bot's user ID
      const botSocket = activeBotsData.bots.find((b: any) => 
        b.table_id === tableId && b.display_name === playerName
      );
      
      if (!botSocket || !botSocket.socket_id) {
        alert('Bot socket not found. The bot may have already left the game.');
        return;
      }

      // Remove the bot
      const removeResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/test/bots/remove/${botSocket.socket_id}`,
        { method: 'DELETE' }
      );
      const removeData = await removeResponse.json();
      
      if (removeData.success) {
        setSuccess(`✅ ${playerName} has been removed from Table ${tableId}`);
        fetchActiveTables(); // Refresh tables
      } else {
        setError(removeData.error || 'Failed to remove bot');
      }
    } catch (err: any) {
      console.error('Error removing bot:', err);
      setError(err.message || 'Failed to remove bot');
    }
  };

  return (
    <div className="bot-assignment-simplified">
      <div className="simplified-header">
        <h2>🤖 Spawn & Assign Bot</h2>
        <p className="description">
          Quickly spawn a bot and assign it to any table. The bot will automatically start playing when the game begins.
        </p>
      </div>

      {/* Active Games Section */}
      <div className="active-games-section">
        <div className="section-header">
          <h3>🎮 Active Games</h3>
          <button className="btn-refresh-tables" onClick={fetchActiveTables} disabled={loadingTables}>
            {loadingTables ? '⏳' : '🔄'} Refresh
          </button>
        </div>
        
        {loadingTables ? (
          <div className="tables-loading">Loading active games...</div>
        ) : activeTables.length === 0 ? (
          <div className="no-tables">
            <p>No active games found. Create a new game or wait for players to join.</p>
          </div>
        ) : (
          <div className="active-tables-grid">
            {activeTables.map((table) => (
              <div 
                key={table.id} 
                className={`table-card ${tableId === String(table.id) ? 'selected' : ''}`}
                onClick={() => setTableId(String(table.id))}
              >
                <div className="table-card-header">
                  <span className="table-id">Table #{table.id}</span>
                  <span className={`game-mode-badge ${table.gameMode.toLowerCase()}`}>
                    {table.gameMode === 'practice' ? '🪙 Coins' : '💵 Cash'}
                  </span>
                </div>
                <div className="table-card-body">
                  <div className="table-stat">
                    <span className="stat-label">Players:</span>
                    <span className="stat-value">{table.playerCount}/{table.maxPlayers}</span>
                  </div>
                  <div className="table-stat">
                    <span className="stat-label">Active:</span>
                    <span className="stat-value">{table.activePlayers}</span>
                  </div>
                  <div className="table-stat">
                    <span className="stat-label">State:</span>
                    <span className={`stat-value state-${table.gameState.toLowerCase()}`}>
                      {table.gameState}
                    </span>
                  </div>
                  {table.pot > 0 && (
                    <div className="table-stat">
                      <span className="stat-label">Pot:</span>
                      <span className="stat-value pot">{table.pot}</span>
                    </div>
                  )}
                  
                  {/* Player List */}
                  {table.players && table.players.length > 0 && (
                    <div className="table-players-list">
                      <div className="players-header">👥 Players:</div>
                      {table.players.map((player) => (
                        <div key={player.playerId} className={`player-item ${player.isBot ? 'bot-player' : 'human-player'}`}>
                          <span className="player-name">
                            {player.isBot ? '🤖' : '👤'} {player.userName}
                            {player.hasFolded && ' (Folded)'}
                          </span>
                          {player.isBot && (
                            <button
                              className="btn-remove-bot-mini"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveBot(player.playerId, player.userName, table.id);
                              }}
                              title="Remove bot from table"
                            >
                              ❌
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="table-card-footer">
                  <button 
                    className="btn-select-table"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTableId(String(table.id));
                    }}
                  >
                    {tableId === String(table.id) ? '✓ Selected' : 'Select Table'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="simplified-form-card">
        <div className="form-section">
          <h3>📍 Table Selection</h3>
          <div className="form-group">
            <label>Table ID <span className="required">*</span></label>
            <input
              type="number"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              placeholder="Enter table ID (e.g., 1, 20001)"
              className="form-input"
              min="1"
            />
            <small className="form-hint">
              💡 Coins tables: 10000-19999 | Cash tables: 20000-29999
            </small>
          </div>
        </div>

        <div className="form-section">
          <h3>👤 Bot Identity</h3>
          <div className="form-group">
            <label>Display Name <span className="optional">(optional)</span></label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Leave empty for random name"
              className="form-input"
              maxLength={20}
            />
            <small className="form-hint">
              🎲 Leave blank to generate a random bot name automatically
            </small>
          </div>
        </div>

        <div className="form-section">
          <h3>🎯 Bot Behavior Profile</h3>
          <div className="form-group">
            <label>Aggressiveness Level <span className="required">*</span></label>
            <div className="behavior-selector">
              <button
                type="button"
                className={`behavior-btn ${behaviorProfile === 'conservative' ? 'active conservative' : ''}`}
                onClick={() => setBehaviorProfile('conservative')}
              >
                <div className="behavior-icon">🛡️</div>
                <div className="behavior-label">Conservative</div>
                <div className="behavior-desc">Plays safe, folds weak hands</div>
              </button>
              <button
                type="button"
                className={`behavior-btn ${behaviorProfile === 'balanced' ? 'active balanced' : ''}`}
                onClick={() => setBehaviorProfile('balanced')}
              >
                <div className="behavior-icon">⚖️</div>
                <div className="behavior-label">Balanced</div>
                <div className="behavior-desc">Mix of safe and risky plays</div>
              </button>
              <button
                type="button"
                className={`behavior-btn ${behaviorProfile === 'aggressive' ? 'active aggressive' : ''}`}
                onClick={() => setBehaviorProfile('aggressive')}
              >
                <div className="behavior-icon">⚔️</div>
                <div className="behavior-label">Aggressive</div>
                <div className="behavior-desc">Bets big, bluffs frequently</div>
              </button>
            </div>
            <small className="form-hint">
              💡 Bot will analyze pot odds and betting patterns to make intelligent decisions
            </small>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">❌</span>
            <span className="alert-message">{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            <span className="alert-message">{success}</span>
          </div>
        )}

        <div className="form-actions">
          <button
            className="btn-spawn-bot"
            onClick={handleSpawnBot}
            disabled={loading || !tableId}
          >
            {loading ? (
              <>
                <span className="spinner">⏳</span> Spawning Bot...
              </>
            ) : (
              <>
                <span>🤖</span> Spawn & Assign Bot
              </>
            )}
          </button>
        </div>
      </div>

      <div className="info-cards">
        <div className="info-card">
          <div className="info-icon">⚡</div>
          <div className="info-content">
            <h4>Instant Assignment</h4>
            <p>Bot joins the table immediately and starts playing</p>
          </div>
        </div>
        <div className="info-card">
          <div className="info-icon">🎯</div>
          <div className="info-content">
            <h4>Smart AI</h4>
            <p>Bot makes realistic decisions based on game state</p>
          </div>
        </div>
        <div className="info-card">
          <div className="info-icon">�</div>
          <div className="info-content">
            <h4>Auto-Play</h4>
            <p>Bot automatically plays turns without manual intervention</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotAssignmentPanel;
