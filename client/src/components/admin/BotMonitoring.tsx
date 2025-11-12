import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';

interface BotInstance {
  bot_instance_id: string;
  display_name: string;
  bot_id: string;
  avatar_url: string;
  behavior_profile: string;
  identity_mode: string;
  assigned_table_id: number | null;
  assigned_seat_index: number | null;
  games_played: number;
  total_winnings: number;
  win_rate: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

interface AuditLog {
  log_id: string;
  admin_id: string;
  action: string;
  details: any;
  timestamp: string;
}

export const BotMonitoring: React.FC = () => {
  const [instances, setInstances] = useState<BotInstance[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'instances' | 'audit'>('instances');

  useEffect(() => {
    loadData();
    // Refresh every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      
      const [instancesData, logsData] = await Promise.all([
        apiFetch('/admin/bot_instances'),
        apiFetch('/admin/audit-logs?limit=50')
      ]);

      setInstances(instancesData.instances || []);
      setAuditLogs(logsData.logs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRotateIdentity = async (instanceId: string) => {
    if (!confirm('Are you sure you want to rotate this bot\'s identity? This will generate a new name and avatar.')) {
      return;
    }

    try {
      setError(null);
      await apiFetch(`/api/admin/bot_instances/${instanceId}/rotate-identity`, {
        method: 'POST'
      });
      
      await loadData();
      alert('Bot identity rotated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to rotate identity');
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeactivateBot = async (instanceId: string) => {
    if (!confirm('Are you sure you want to deactivate this bot?')) {
      return;
    }

    try {
      setError(null);
      await apiFetch(`/api/admin/bots/${instanceId}`, {
        method: 'DELETE'
      });
      
      await loadData();
      alert('Bot deactivated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate bot');
      alert(`Error: ${err.message}`);
    }
  };

  const getStatusColor = (isActive: boolean): string => {
    return isActive ? 'text-green-300 bg-green-900 bg-opacity-30 border border-green-700 border-opacity-30' : 'text-gray-400 bg-gray-900 bg-opacity-30 border border-gray-700 border-opacity-30';
  };

  const formatWinRate = (rate: number): string => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && instances.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading bot data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Bot Monitoring & Analytics</h1>
        <p className="text-gray-400 mt-1">Real-time monitoring of bot instances and audit logs</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-900 bg-opacity-20 border border-red-700 rounded-lg">
          <p className="text-red-400">⚠️ {error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-yellow-700 border-opacity-30">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('instances')}
            className={`pb-3 px-2 font-semibold transition ${
              activeTab === 'instances'
                ? 'border-b-2 border-yellow-500 text-yellow-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            🤖 Bot Instances ({instances.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-2 font-semibold transition ${
              activeTab === 'audit'
                ? 'border-b-2 border-yellow-500 text-yellow-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            📋 Audit Logs ({auditLogs.length})
          </button>
        </nav>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-black bg-opacity-30 p-4 rounded-lg shadow border border-yellow-600 border-opacity-30">
          <p className="text-sm text-gray-400">Total Bots</p>
          <p className="text-2xl font-bold text-yellow-400">{instances.length}</p>
        </div>
        <div className="bg-black bg-opacity-30 p-4 rounded-lg shadow border border-green-600 border-opacity-30">
          <p className="text-sm text-gray-400">Active Bots</p>
          <p className="text-2xl font-bold text-green-400">
            {instances.filter(b => b.is_active).length}
          </p>
        </div>
        <div className="bg-black bg-opacity-30 p-4 rounded-lg shadow border border-purple-600 border-opacity-30">
          <p className="text-sm text-gray-400">Assigned to Tables</p>
          <p className="text-2xl font-bold text-purple-400">
            {instances.filter(b => b.assigned_table_id !== null).length}
          </p>
        </div>
        <div className="bg-black bg-opacity-30 p-4 rounded-lg shadow border border-orange-600 border-opacity-30">
          <p className="text-sm text-gray-400">Avg Win Rate</p>
          <p className="text-2xl font-bold text-orange-400">
            {formatWinRate(
              instances.reduce((sum, b) => sum + (b.win_rate || 0), 0) / (instances.length || 1)
            )}
          </p>
        </div>
      </div>

      {/* Bot Instances Tab */}
      {activeTab === 'instances' && (
        <div className="bg-black bg-opacity-30 rounded-lg shadow overflow-hidden border border-yellow-600 border-opacity-20">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-yellow-700 divide-opacity-20">
              <thead className="bg-black bg-opacity-40">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase">Bot</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase">Stats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase">Identity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-700 divide-opacity-10">
                {instances.map((bot) => (
                  <tr key={bot.bot_instance_id} className="hover:bg-yellow-700 hover:bg-opacity-5 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={bot.avatar_url || '/default-avatar.png'} 
                          alt={bot.display_name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-semibold text-white">{bot.display_name}</p>
                          <p className="text-sm text-gray-400">{bot.bot_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bot.is_active)}`}>
                        {bot.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">{bot.behavior_profile}</p>
                    </td>
                    <td className="px-6 py-4">
                      {bot.assigned_table_id ? (
                        <div>
                          <p className="font-semibold sm text-white">Table {bot.assigned_table_id}</p>
                          <p className="text-xs text-gray-400">Seat {bot.assigned_seat_index}</p>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        <p><span className="font-semibold text-white">{bot.games_played}</span> games</p>
                        <p><span className="font-semibold text-yellow-400">{formatWinRate(bot.win_rate)}</span> win rate</p>
                        <p className="text-xs text-gray-400">{formatCurrency(bot.total_winnings)} won</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-purple-900 bg-opacity-40 text-purple-300 px-2 py-1 rounded border border-purple-700 border-opacity-30">
                        {bot.identity_mode}
                      </span>
                      {bot.expires_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          Expires: {new Date(bot.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRotateIdentity(bot.bot_instance_id)}
                          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                          title="Rotate Identity"
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => handleDeactivateBot(bot.bot_instance_id)}
                          className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition"
                          title="Deactivate"
                        >
                          ❌
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {instances.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No bot instances found</p>
            </div>
          )}
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="bg-black bg-opacity-30 rounded-lg shadow overflow-hidden border border-yellow-600 border-opacity-20">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-yellow-700 divide-opacity-20">
              <thead className="bg-black bg-opacity-40">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-700 divide-opacity-10">
                {auditLogs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-yellow-700 hover:bg-opacity-5 transition">
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {log.admin_id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-900 bg-opacity-40 text-blue-300 border border-blue-700 border-opacity-30">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      <pre className="text-xs overflow-auto max-w-md bg-black bg-opacity-40 p-2 rounded border border-gray-700 border-opacity-30">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {auditLogs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No audit logs found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BotMonitoring;
