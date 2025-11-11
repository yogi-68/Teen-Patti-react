import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';

interface Seat {
  seat_index: number;
  occupant_type: 'human' | 'bot' | 'empty';
  occupant_id: string | null;
  occupant_name: string | null;
  avatar_url: string | null;
  is_locked: boolean;
  version: number;
}

interface Table {
  table_id: number;
  name: string;
  stakes: number;
  max_players: number;
  seats: Seat[];
  bot_count: number;
  human_count: number;
  empty_count: number;
}

interface BotBlueprint {
  bot_blueprint_id: string;
  name: string;
  behavior_profile: string;
  aggression_level: number;
  is_active: boolean;
}

interface AssignBotRequest {
  bot_blueprint_id: string;
  identity_mode: 'persistent' | 'ephemeral' | 'randomize';
  display_name?: string;
  behavior_profile?: string;
}

export const TableSeatManager: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [blueprints, setBlueprints] = useState<BotBlueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<{ tableId: number; seatIndex: number } | null>(null);
  const [showBotModal, setShowBotModal] = useState(false);
  const [botFormData, setBotFormData] = useState<AssignBotRequest>({
    bot_blueprint_id: '',
    identity_mode: 'randomize',
    display_name: '',
    behavior_profile: 'balanced'
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [tablesData, blueprintsData] = await Promise.all([
        apiFetch('/admin/tables'),
        apiFetch('/admin/bots/blueprints')
      ]);

      setTables(tablesData.tables || []);
      setBlueprints(blueprintsData.blueprints || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (tableId: number, seatIndex: number, seat: Seat) => {
    setSelectedSeat({ tableId, seatIndex });
    
    if (seat.occupant_type === 'bot') {
      // Show remove bot confirmation
      handleRemoveBot(tableId, seatIndex);
    } else if (seat.occupant_type === 'empty') {
      // Show assign bot modal
      setBotFormData({
        bot_blueprint_id: blueprints[0]?.bot_blueprint_id || '',
        identity_mode: 'randomize',
        display_name: '',
        behavior_profile: 'balanced'
      });
      setShowBotModal(true);
    } else {
      alert('Cannot modify seat with human player. Please wait for player to leave.');
    }
  };

  const handleAssignBot = async () => {
    if (!selectedSeat || !botFormData.bot_blueprint_id) {
      alert('Please select a bot blueprint');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      await apiFetch(
        `/admin/tables/${selectedSeat.tableId}/seats/${selectedSeat.seatIndex}/assign-bot`,
        {
          method: 'POST',
          body: JSON.stringify(botFormData)
        }
      );

      setShowBotModal(false);
      await loadData(); // Reload to see changes
      alert('Bot assigned successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to assign bot');
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveBot = async (tableId: number, seatIndex: number) => {
    if (!confirm('Are you sure you want to remove this bot from the seat?')) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      await apiFetch(
        `/admin/tables/${tableId}/seats/${seatIndex}/remove-bot`,
        {
          method: 'POST'
        }
      );

      await loadData(); // Reload to see changes
      alert('Bot removed successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to remove bot');
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getSeatColor = (seat: Seat): string => {
    if (seat.is_locked) return 'bg-yellow-200 border-yellow-500';
    switch (seat.occupant_type) {
      case 'bot': return 'bg-blue-100 border-blue-500';
      case 'human': return 'bg-green-100 border-green-500';
      case 'empty': return 'bg-gray-100 border-gray-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getSeatIcon = (seat: Seat): string => {
    switch (seat.occupant_type) {
      case 'bot': return '🤖';
      case 'human': return '👤';
      case 'empty': return '⚪';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Table Seat Manager</h1>
          <p className="text-gray-600 mt-1">Click on empty seats to assign bots, or bot seats to remove them</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">⚠️ {error}</p>
        </div>
      )}

      {/* Legend */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <h3 className="font-semibold mb-2">Legend:</h3>
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">⚪</div>
            <span className="text-sm">Empty (Click to assign bot)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 border-2 border-blue-500 rounded-lg flex items-center justify-center">🤖</div>
            <span className="text-sm">Bot (Click to remove)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 border-2 border-green-500 rounded-lg flex items-center justify-center">👤</div>
            <span className="text-sm">Human Player</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-200 border-2 border-yellow-500 rounded-lg flex items-center justify-center">🔒</div>
            <span className="text-sm">Locked</span>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tables.map((table) => (
          <div key={table.table_id} className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Table {table.table_id}</h3>
                  <p className="text-blue-100 text-sm">{table.name || 'Standard Table'}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">₹{table.stakes}</p>
                  <p className="text-blue-100 text-sm">Stakes</p>
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="bg-gray-50 px-4 py-3 border-b flex justify-around text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{table.bot_count || 0}</p>
                <p className="text-xs text-gray-600">Bots</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{table.human_count || 0}</p>
                <p className="text-xs text-gray-600">Humans</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-500">{table.empty_count || 0}</p>
                <p className="text-xs text-gray-600">Empty</p>
              </div>
            </div>

            {/* Seats Visual */}
            <div className="p-6">
              <div className="relative">
                {/* Table Surface */}
                <div className="w-full aspect-square max-w-md mx-auto bg-gradient-to-br from-green-600 to-green-700 rounded-full shadow-2xl border-8 border-amber-700 flex items-center justify-center">
                  <div className="text-center text-white">
                    <p className="text-4xl font-bold">₹{table.stakes}</p>
                    <p className="text-sm opacity-75">Table {table.table_id}</p>
                  </div>
                </div>

                {/* Seats Positioned Around Table */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {table.seats?.map((seat, index) => {
                    // Calculate position around circle
                    const angle = (index / table.max_players) * 2 * Math.PI - Math.PI / 2;
                    const radius = 45; // percentage
                    const x = 50 + radius * Math.cos(angle);
                    const y = 50 + radius * Math.sin(angle);

                    return (
                      <button
                        key={seat.seat_index}
                        onClick={() => handleSeatClick(table.table_id, seat.seat_index, seat)}
                        disabled={actionLoading || seat.is_locked}
                        className={`absolute w-20 h-20 rounded-xl border-4 ${getSeatColor(seat)} 
                          transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 
                          shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed
                          flex flex-col items-center justify-center cursor-pointer`}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        title={`Seat ${seat.seat_index}: ${seat.occupant_type} ${seat.occupant_name || ''}`}
                      >
                        <span className="text-3xl">{getSeatIcon(seat)}</span>
                        <span className="text-xs font-semibold mt-1">#{seat.seat_index}</span>
                        {seat.occupant_name && (
                          <span className="text-xs truncate w-full px-1 text-center">{seat.occupant_name}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Tables Message */}
      {tables.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg mb-4">⚠️ No tables with bots found</p>
          <p className="text-gray-600 text-sm">
            This page shows tables that have bots assigned. To see a table here:
            <br/>1. Players must create and join a game table
            <br/>2. Use "Bot Management" → "Assign Bots" to add bots to active tables
          </p>
        </div>
      )}

      {/* Assign Bot Modal */}
      {showBotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Assign Bot to Seat</h2>
              
              <div className="space-y-4">
                {/* Blueprint Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bot Blueprint</label>
                  <select
                    value={botFormData.bot_blueprint_id}
                    onChange={(e) => setBotFormData({ ...botFormData, bot_blueprint_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">Select a blueprint...</option>
                    {blueprints.filter(b => b.is_active).map((bp) => (
                      <option key={bp.bot_blueprint_id} value={bp.bot_blueprint_id}>
                        {bp.name} ({bp.behavior_profile})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Identity Mode */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Identity Mode</label>
                  <select
                    value={botFormData.identity_mode}
                    onChange={(e) => setBotFormData({ ...botFormData, identity_mode: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="randomize">Randomize (New identity each time)</option>
                    <option value="ephemeral">Ephemeral (24-hour session)</option>
                    <option value="persistent">Persistent (Keep same identity)</option>
                  </select>
                </div>

                {/* Display Name Override */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Display Name (Optional)
                    <span className="text-xs text-gray-500 ml-2">Leave empty for auto-generated</span>
                  </label>
                  <input
                    type="text"
                    value={botFormData.display_name}
                    onChange={(e) => setBotFormData({ ...botFormData, display_name: e.target.value })}
                    placeholder="e.g., Ravi Kumar"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>

                {/* Behavior Profile */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Behavior Profile</label>
                  <select
                    value={botFormData.behavior_profile}
                    onChange={(e) => setBotFormData({ ...botFormData, behavior_profile: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="conservative">Conservative (Plays safe)</option>
                    <option value="balanced">Balanced (Moderate risk)</option>
                    <option value="aggressive">Aggressive (High risk)</option>
                    <option value="unpredictable">Unpredictable (Random)</option>
                  </select>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Selected:</strong> Table {selectedSeat?.tableId}, Seat {selectedSeat?.seatIndex}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowBotModal(false)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignBot}
                  disabled={actionLoading || !botFormData.bot_blueprint_id}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 font-medium"
                >
                  {actionLoading ? 'Assigning...' : 'Assign Bot'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSeatManager;
