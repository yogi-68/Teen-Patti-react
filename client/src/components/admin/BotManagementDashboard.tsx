/**
 * BotManagementDashboard - Complete Admin UI
 * Includes: Table view, bot editor, monitoring, audit logs, analytics
 */

import React, { useState, useEffect } from 'react';
import TableSeatsView from './TableSeatsView';

const API_URL = import.meta.env.VITE_API_URL;

interface BotBlueprint {
  bot_blueprint_id: string;
  display_name_template: string;
  behavior_profile: any;
  default_level: number;
  persistent: boolean;
}

interface BotInstance {
  bot_instance_id: string;
  display_name: string;
  bot_id: string;
  assigned_table_id: number;
  assigned_seat_index: number;
  games_played: number;
  games_won: number;
  is_active: boolean;
}

interface AuditLog {
  log_id: string;
  action: string;
  admin_name: string;
  table_id: number;
  seat_index: number;
  bot_instance_id?: string;
  details: any;
  timestamp: string;
}

const BotManagementDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tables' | 'bots' | 'analytics' | 'audit'>('tables');
  const [botInstances, setBotInstances] = useState<BotInstance[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [showBotEditor, setShowBotEditor] = useState(false);

  // Bot Editor State
  const [blueprints, setBlueprints] = useState<BotBlueprint[]>([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState<string>('');
  const [formData, setFormData] = useState({
    table_id: 1,
    seat_index: 0,
    balance_coins: 10000,
    ttl_minutes: 60
  });

  useEffect(() => {
    fetchBlueprints();
    fetchBotInstances();
    fetchAuditLogs();
    fetchAnalytics();

    // Set up event listeners for actions from TableSeatsView
    const handleAssignBot = (e: any) => {
      setFormData(prev => ({
        ...prev,
        table_id: e.detail.tableId,
        seat_index: e.detail.seatIndex
      }));
      setShowBotEditor(true);
    };

    const handleRemoveBot = async (e: any) => {
      if (confirm('Remove bot from this seat?')) {
        await removeBot(e.detail.tableId, e.detail.seatIndex);
      }
    };

    const handleRotateIdentity = async (e: any) => {
      if (confirm('Rotate bot identity?')) {
        await rotateIdentity(e.detail.botId);
      }
    };

    window.addEventListener('assignBot' as any, handleAssignBot);
    window.addEventListener('removeBot' as any, handleRemoveBot);
    window.addEventListener('rotateIdentity' as any, handleRotateIdentity);

    return () => {
      window.removeEventListener('assignBot' as any, handleAssignBot);
      window.removeEventListener('removeBot' as any, handleRemoveBot);
      window.removeEventListener('rotateIdentity' as any, handleRotateIdentity);
    };
  }, []);

  const fetchBlueprints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/bots/blueprints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setBlueprints(data.blueprints || []);
      if (data.blueprints?.length > 0) {
        setSelectedBlueprint(data.blueprints[0].bot_blueprint_id);
      }
    } catch (err) {
      console.error('Error fetching blueprints:', err);
    }
  };

  const fetchBotInstances = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/bot_instances?active=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setBotInstances(data.instances || []);
    } catch (err) {
      console.error('Error fetching bot instances:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/audit-logs?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setAuditLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/bot-analytics/system/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const assignBot = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/bots/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          bot_blueprint_id: selectedBlueprint
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign bot');
      }

      alert('Bot assigned successfully!');
      setShowBotEditor(false);
      fetchBotInstances();
      window.location.reload(); // Refresh table view
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const removeBot = async (tableId: number, seatIndex: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/bots/remove`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          table_id: tableId,
          seat_index: seatIndex,
          reason: 'Admin removal'
        })
      });

      if (!response.ok) throw new Error('Failed to remove bot');

      alert('Bot removed successfully!');
      fetchBotInstances();
      window.location.reload();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const rotateIdentity = async (botId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/bot_instances/${botId}/rotate-identity`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to rotate identity');

      alert('Identity rotated successfully!');
      fetchBotInstances();
      window.location.reload();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const deactivateBot = async (botId: string) => {
    if (!confirm('Deactivate this bot?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/bot_instances/${botId}/deactivate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to deactivate bot');

      alert('Bot deactivated successfully!');
      fetchBotInstances();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Bot Editor Modal
  const renderBotEditor = () => {
    if (!showBotEditor) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <h3 className="text-xl font-bold mb-4">Assign Bot to Seat</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Table ID</label>
              <input
                type="number"
                value={formData.table_id}
                onChange={(e) => setFormData({...formData, table_id: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Seat Index (0-5)</label>
              <input
                type="number"
                min="0"
                max="5"
                value={formData.seat_index}
                onChange={(e) => setFormData({...formData, seat_index: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bot Blueprint</label>
              <select
                value={selectedBlueprint}
                onChange={(e) => setSelectedBlueprint(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                {blueprints.map(bp => (
                  <option key={bp.bot_blueprint_id} value={bp.bot_blueprint_id}>
                    {bp.display_name_template} (Level {bp.default_level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Starting Balance (Coins)</label>
              <input
                type="number"
                value={formData.balance_coins}
                onChange={(e) => setFormData({...formData, balance_coins: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">TTL (minutes, 0 = persistent)</label>
              <input
                type="number"
                value={formData.ttl_minutes}
                onChange={(e) => setFormData({...formData, ttl_minutes: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={assignBot}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Assign Bot
            </button>
            <button
              onClick={() => setShowBotEditor(false)}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Bot Monitoring Tab
  const renderMonitoring = () => (
    <div className="space-y-6">
      {/* System Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="text-sm font-medium text-gray-600">Active Bots</h4>
            <p className="text-3xl font-bold text-green-600">{analytics.active_bots || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="text-sm font-medium text-gray-600">Total Created</h4>
            <p className="text-3xl font-bold text-blue-600">{analytics.total_bots_created || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="text-sm font-medium text-gray-600">Tables with Bots</h4>
            <p className="text-3xl font-bold text-purple-600">{analytics.tables_with_bots || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="text-sm font-medium text-gray-600">Avg Bots/Table</h4>
            <p className="text-3xl font-bold text-orange-600">
              {analytics.avg_bots_per_table?.toFixed(1) || '0.0'}
            </p>
          </div>
        </div>
      )}

      {/* Active Bot Instances */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Active Bot Instances</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium">Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Bot ID</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Table</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Seat</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Games</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Win Rate</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {botInstances.map(bot => {
                const winRate = bot.games_played > 0 
                  ? ((bot.games_won / bot.games_played) * 100).toFixed(1)
                  : '0.0';
                const isAnomalous = parseFloat(winRate) > 70;

                return (
                  <tr key={bot.bot_instance_id} className={isAnomalous ? 'bg-red-50' : ''}>
                    <td className="px-4 py-2">{bot.display_name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{bot.bot_id}</td>
                    <td className="px-4 py-2">{bot.assigned_table_id}</td>
                    <td className="px-4 py-2">{bot.assigned_seat_index}</td>
                    <td className="px-4 py-2">{bot.games_played}</td>
                    <td className="px-4 py-2">
                      <span className={isAnomalous ? 'text-red-600 font-bold' : ''}>
                        {winRate}%
                        {isAnomalous && ' ⚠️'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => rotateIdentity(bot.bot_instance_id)}
                        className="mr-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                        title="Rotate Identity"
                      >
                        🔄
                      </button>
                      <button
                        onClick={() => deactivateBot(bot.bot_instance_id)}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        title="Deactivate"
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {botInstances.length === 0 && (
            <p className="text-center py-8 text-gray-500">No active bots</p>
          )}
        </div>
      </div>
    </div>
  );

  // Audit Log Tab
  const renderAuditLogs = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">Audit Logs</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium">Timestamp</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Action</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Admin</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Table</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Seat</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {auditLogs.map(log => (
              <tr key={log.log_id}>
                <td className="px-4 py-2 text-sm">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">{log.admin_name}</td>
                <td className="px-4 py-2">{log.table_id}</td>
                <td className="px-4 py-2">{log.seat_index}</td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {JSON.stringify(log.details).substring(0, 50)}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {auditLogs.length === 0 && (
          <p className="text-center py-8 text-gray-500">No audit logs</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Bot Management Dashboard</h1>
        <p className="text-gray-600">Manage bots, monitor performance, and view audit logs</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 bg-white rounded-lg shadow">
        <div className="flex border-b">
          {['tables', 'bots', 'analytics', 'audit'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'tables' && <TableSeatsView />}
        {activeTab === 'bots' && renderMonitoring()}
        {activeTab === 'analytics' && renderMonitoring()}
        {activeTab === 'audit' && renderAuditLogs()}
      </div>

      {/* Bot Editor Modal */}
      {renderBotEditor()}
    </div>
  );
};

export default BotManagementDashboard;
