import React, { useState, useEffect } from 'react';
import { getSocket } from '../../utils/socket';
import BotAvatarModal from './BotAvatarModal';
import './BotManagement.css';

interface BotInstance {
  bot_instance_id: string;
  bot_blueprint_id: string;
  display_name: string;
  bot_id: string;
  avatar_url?: string;
  assigned_table_id?: number;
  assigned_seat_index?: number;
  is_active: boolean;
  behavior_profile: string;
  games_played: number;
  games_won: number;
  total_winnings: number;
}

export const BotControlPanel: React.FC = () => {
  const [bots, setBots] = useState<BotInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'assigned' | 'unassigned'>('all');
  const [selectedBot, setSelectedBot] = useState<BotInstance | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  useEffect(() => {
    fetchBots();
    setupSocketListeners();

    const socket = getSocket();
    return () => {
      socket.off('bot:assigned');
      socket.off('bot:removed');
      socket.off('bot:identityRotated');
    };
  }, []);

  const fetchBots = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/test/bots`);
      const data = await response.json();
      
      console.log('📊 Bot Control Panel - API Response:', data);
      
      if (data.status === 'ok' && data.bot_instances) {
        setBots(data.bot_instances || []);
      } else if (data.success && data.instances) {
        // Fallback for alternative response format
        setBots(data.instances || []);
      } else {
        setError(data.message || data.error || 'Failed to fetch bots');
      }
    } catch (err: any) {
      console.error('❌ Bot Control Panel - Fetch Error:', err);
      setError(err.message || 'Failed to fetch bots');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    const socket = getSocket();
    
    socket.on('bot:assigned', (data: any) => {
      console.log('Bot assigned:', data);
      fetchBots(); // Refresh list
    });

    socket.on('bot:removed', (data: any) => {
      console.log('Bot removed:', data);
      fetchBots(); // Refresh list
    });

    socket.on('bot:identityRotated', (data: any) => {
      console.log('Bot identity rotated:', data);
      fetchBots(); // Refresh list
    });
  };

  const handleDeactivate = async (instanceId: string) => {
    if (!confirm('Are you sure you want to deactivate this bot?')) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/test/bots/instance/${instanceId}/deactivate`,
        { method: 'POST' }
      );
      const data = await response.json();
      
      if (data.success) {
        fetchBots();
      } else {
        alert(data.message || 'Failed to deactivate bot');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate bot');
    }
  };

  const handleRotateIdentity = async (instanceId: string) => {
    if (!confirm('Rotate this bot\'s identity?')) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/test/bots/instance/${instanceId}/rotate-identity`,
        { method: 'POST' }
      );
      const data = await response.json();
      
      if (data.success) {
        fetchBots();
      } else {
        alert(data.message || 'Failed to rotate identity');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to rotate identity');
    }
  };

  const filteredBots = bots.filter(bot => {
    if (filter === 'active') return bot.is_active;
    if (filter === 'assigned') return bot.assigned_table_id !== undefined;
    if (filter === 'unassigned') return bot.assigned_table_id === undefined;
    return true;
  });

  if (loading) {
    return <div className="loading">Loading bots...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="bot-control-panel">
      <div className="control-panel-header">
        <h2>Active Bots ({filteredBots.length})</h2>
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'active' ? 'active' : ''}
            onClick={() => setFilter('active')}
          >
            Active Only
          </button>
          <button
            className={filter === 'assigned' ? 'active' : ''}
            onClick={() => setFilter('assigned')}
          >
            Assigned
          </button>
          <button
            className={filter === 'unassigned' ? 'active' : ''}
            onClick={() => setFilter('unassigned')}
          >
            Unassigned
          </button>
        </div>
      </div>

      <div className="bots-grid">
        {filteredBots.map(bot => (
          <div key={bot.bot_instance_id} className={`bot-card ${!bot.is_active ? 'inactive' : ''}`}>
            <div className="bot-card-header">
              <div className="bot-avatar">
                {bot.avatar_url ? (
                  <img src={bot.avatar_url} alt={bot.display_name} />
                ) : (
                  <div className="avatar-placeholder">🤖</div>
                )}
              </div>
              <div className="bot-info">
                <h3>{bot.display_name}</h3>
                <p className="bot-id">{bot.bot_id}</p>
                <span className={`badge ${bot.behavior_profile}`}>
                  {bot.behavior_profile}
                </span>
              </div>
            </div>

            <div className="bot-card-body">
              <div className="bot-status">
                <div className="status-row">
                  <span>Status:</span>
                  <span className={bot.is_active ? 'status-active' : 'status-inactive'}>
                    {bot.is_active ? '🟢 Active' : '🔴 Inactive'}
                  </span>
                </div>
                {bot.assigned_table_id !== undefined && (
                  <div className="status-row">
                    <span>Table:</span>
                    <span className="highlight">Table {bot.assigned_table_id}</span>
                  </div>
                )}
                {bot.assigned_seat_index !== undefined && (
                  <div className="status-row">
                    <span>Seat:</span>
                    <span>Seat {bot.assigned_seat_index}</span>
                  </div>
                )}
              </div>

              <div className="bot-stats">
                <div className="stat">
                  <span className="stat-label">Games:</span>
                  <span className="stat-value">{bot.games_played}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Wins:</span>
                  <span className="stat-value">{bot.games_won}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Winnings:</span>
                  <span className="stat-value">₹{bot.total_winnings}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Win Rate:</span>
                  <span className="stat-value">
                    {bot.games_played > 0 
                      ? `${((bot.games_won / bot.games_played) * 100).toFixed(1)}%`
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="bot-card-actions">
              <button
                className="btn-avatar"
                onClick={() => {
                  setSelectedBot(bot);
                  setIsAvatarModalOpen(true);
                }}
                title="Change Avatar"
              >
                🖼️ Avatar
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleRotateIdentity(bot.bot_instance_id)}
                disabled={!bot.is_active}
              >
                🔄 Rotate ID
              </button>
              <button
                className="btn-danger"
                onClick={() => handleDeactivate(bot.bot_instance_id)}
                disabled={!bot.is_active}
              >
                ⛔ Deactivate
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredBots.length === 0 && (
        <div className="empty-state">
          <p>No bots found matching the filter.</p>
        </div>
      )}

      {selectedBot && (
        <BotAvatarModal
          bot={selectedBot}
          isOpen={isAvatarModalOpen}
          onClose={() => {
            setIsAvatarModalOpen(false);
            setSelectedBot(null);
          }}
          onAvatarUpdated={() => {
            fetchBots();
          }}
        />
      )}
    </div>
  );
};

export default BotControlPanel;
