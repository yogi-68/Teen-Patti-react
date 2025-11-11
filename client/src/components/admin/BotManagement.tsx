import React, { useState } from 'react';
import { BotAssignmentPanel } from './BotAssignmentPanel';
import { BotControlPanel } from './BotControlPanel';
import { BotStatsDashboard } from './BotStatsDashboard';
import { BotSchedulerPanel } from './BotSchedulerPanel';
import './BotManagement.css';

export const BotManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'control' | 'assign' | 'stats' | 'scheduler'>('assign');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="bot-management">
      <div className="bot-management-header">
        <h1>🤖 Bot Management System</h1>
        <button className="btn-refresh" onClick={handleRefresh}>
          🔄 Refresh
        </button>
      </div>

      <div className="bot-management-tabs">
        <button
          className={`tab-btn ${activeTab === 'assign' ? 'active' : ''}`}
          onClick={() => setActiveTab('assign')}
        >
          ➕ Assign Bots
        </button>
        <button
          className={`tab-btn ${activeTab === 'control' ? 'active' : ''}`}
          onClick={() => setActiveTab('control')}
        >
          🎮 Control Panel
        </button>
        <button
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === 'scheduler' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduler')}
        >
          ⏰ Scheduler
        </button>
      </div>

      <div className="bot-management-content">
        {activeTab === 'control' && <BotControlPanel key={refreshKey} />}
        {activeTab === 'assign' && <BotAssignmentPanel key={refreshKey} />}
        {activeTab === 'stats' && <BotStatsDashboard key={refreshKey} />}
        {activeTab === 'scheduler' && <BotSchedulerPanel key={refreshKey} />}
      </div>
    </div>
  );
};

export default BotManagement;
