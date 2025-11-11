import React, { useState, useEffect } from 'react';
import './BotManagement.css';

interface BotBlueprint {
  bot_blueprint_id: string;
  behavior_profile: string;
  identity_mode: string;
  is_active: boolean;
}

interface BotInstance {
  bot_instance_id: string;
  display_name: string;
  bot_id: string;
  assigned_table_id?: number;
  is_active: boolean;
}

export const BotAssignmentPanel: React.FC = () => {
  const [blueprints, setBlueprints] = useState<BotBlueprint[]>([]);
  const [availableBots, setAvailableBots] = useState<BotInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlueprint, setSelectedBlueprint] = useState<string>('');
  const [tableId, setTableId] = useState<number>(1);
  const [seatIndex, setSeatIndex] = useState<number>(0);
  const [count, setCount] = useState<number>(1);

  useEffect(() => {
    fetchBlueprints();
    fetchAvailableBots();
  }, []);

  const fetchBlueprints = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/test/bot-blueprints`);
      const data = await response.json();
      if (data.success) {
        setBlueprints(data.blueprints || []);
      }
    } catch (err) {
      console.error('Failed to fetch blueprints:', err);
    }
  };

  const fetchAvailableBots = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/test/bots`);
      const data = await response.json();
      if (data.success) {
        // Filter unassigned bots
        const unassigned = (data.instances || []).filter((bot: BotInstance) => 
          bot.assigned_table_id === undefined && bot.is_active
        );
        setAvailableBots(unassigned);
      }
    } catch (err) {
      console.error('Failed to fetch bots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignNew = async () => {
    if (!selectedBlueprint) {
      alert('Please select a bot blueprint');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/test/bots/blueprint/${selectedBlueprint}/assign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableId,
            seatIndex,
            count
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(`Successfully assigned ${count} bot(s) to table ${tableId}`);
        fetchAvailableBots();
      } else {
        alert(data.message || 'Failed to assign bots');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to assign bots');
    }
  };

  const handleAssignExisting = async (botInstanceId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/test/bots/instance/${botInstanceId}/assign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableId,
            seatIndex
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(`Bot assigned to table ${tableId}, seat ${seatIndex}`);
        fetchAvailableBots();
      } else {
        alert(data.message || 'Failed to assign bot');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to assign bot');
    }
  };

  return (
    <div className="bot-assignment-panel">
      <div className="assignment-section">
        <h2>🎯 Assign New Bots</h2>
        <div className="assignment-form">
          <div className="form-group">
            <label>Bot Blueprint:</label>
            <select
              value={selectedBlueprint}
              onChange={(e) => setSelectedBlueprint(e.target.value)}
            >
              <option value="">Select a blueprint...</option>
              {blueprints.map(bp => (
                <option key={bp.bot_blueprint_id} value={bp.bot_blueprint_id}>
                  {bp.behavior_profile} ({bp.identity_mode})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Table ID:</label>
              <input
                type="text"
                value={tableId}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1) setTableId(val);
                }}
                placeholder="1"
              />
            </div>

            <div className="form-group">
              <label>Seat Index (0-5):</label>
              <input
                type="text"
                value={seatIndex}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 0 && val <= 5) setSeatIndex(val);
                }}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label>Count (1-6):</label>
              <input
                type="text"
                value={count}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1 && val <= 6) setCount(val);
                }}
                placeholder="1"
              />
            </div>
          </div>

          <button className="btn-primary" onClick={handleAssignNew}>
            ➕ Assign {count} Bot{count > 1 ? 's' : ''}
          </button>
        </div>
      </div>

      <div className="assignment-section">
        <h2>🤖 Available Bots ({availableBots.length})</h2>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : availableBots.length === 0 ? (
          <div className="empty-state">
            <p>No unassigned bots available.</p>
            <p className="hint">Create new bots using the form above.</p>
          </div>
        ) : (
          <div className="available-bots-list">
            {availableBots.map(bot => (
              <div key={bot.bot_instance_id} className="available-bot-card">
                <div className="bot-info">
                  <h4>{bot.display_name}</h4>
                  <p className="bot-id-small">{bot.bot_id}</p>
                </div>
                <button
                  className="btn-assign"
                  onClick={() => handleAssignExisting(bot.bot_instance_id)}
                >
                  Assign to Table {tableId}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="assignment-tips">
        <h3>💡 Tips:</h3>
        <ul>
          <li>Seat indices range from 0-5 for a 6-player table</li>
          <li>Assigning multiple bots will fill consecutive seats</li>
          <li>Bots will automatically join the specified table</li>
          <li>Use the Control Panel to monitor assigned bots</li>
        </ul>
      </div>
    </div>
  );
};

export default BotAssignmentPanel;
