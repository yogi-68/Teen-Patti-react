import React, { useState } from 'react';
import './BotManagement.css';

export const BotAssignmentPanel: React.FC = () => {
  const [tableId, setTableId] = useState('1');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to spawn bot');
      }

      setSuccess(`Bot "${data.bot.display_name}" spawned and joined table ${data.bot.table_id}!`);
      setDisplayName('');
    } catch (err: any) {
      setError(err.message || 'Failed to spawn bot');
    } finally {
      setLoading(false);
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
