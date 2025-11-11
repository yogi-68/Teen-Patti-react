import React, { useState, useEffect } from 'react';
import './BotManagement.css';

interface ScheduledTask {
  name: string;
  schedule: string;
  description: string;
  details: string;
}

interface TaskStatus {
  name: string;
  running: boolean;
  description: string;
}

export const BotSchedulerPanel: React.FC = () => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/scheduler/tasks`
      );
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/scheduler/status`
      );
      const data = await response.json();
      if (data.success) {
        setStatuses(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerTask = async (taskName: string) => {
    if (!confirm(`Manually trigger task "${taskName}"?`)) return;

    try {
      setTriggering(taskName);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/scheduler/trigger/${taskName}`,
        { method: 'POST' }
      );
      const data = await response.json();
      
      if (data.success) {
        alert(`Task "${taskName}" executed successfully!`);
        fetchStatus();
      } else {
        alert(data.message || 'Failed to trigger task');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to trigger task');
    } finally {
      setTriggering(null);
    }
  };

  const handleStopTask = async (taskName: string) => {
    if (!confirm(`Stop task "${taskName}"?`)) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/scheduler/stop/${taskName}`,
        { method: 'POST' }
      );
      const data = await response.json();
      
      if (data.success) {
        alert(`Task "${taskName}" stopped!`);
        fetchStatus();
      } else {
        alert(data.message || 'Failed to stop task');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to stop task');
    }
  };

  const handleReinitialize = async () => {
    if (!confirm('Reinitialize all scheduled tasks?')) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/scheduler/reinitialize`,
        { method: 'POST' }
      );
      const data = await response.json();
      
      if (data.success) {
        alert('Scheduler reinitialized successfully!');
        fetchStatus();
      } else {
        alert(data.message || 'Failed to reinitialize scheduler');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reinitialize scheduler');
    }
  };

  const getTaskIcon = (taskName: string): string => {
    const icons: { [key: string]: string } = {
      'cleanup-expired': '🗑️',
      'rotate-identities': '🔄',
      'deactivate-idle': '💤',
      'reset-test-bots': '🧪',
      'health-check': '📊'
    };
    return icons[taskName] || '⏰';
  };

  return (
    <div className="bot-scheduler-panel">
      <div className="scheduler-header">
        <h2>⏰ Bot Scheduler</h2>
        <button className="btn-primary" onClick={handleReinitialize}>
          🔄 Reinitialize All
        </button>
      </div>

      {/* What is Bot Scheduler - Explanation */}
      <div className="scheduler-explanation">
        <h3>ℹ️ What is Bot Scheduler?</h3>
        <p>
          The Bot Scheduler is an automated task manager that runs background jobs to maintain bot health and system efficiency. 
          It uses <strong>cron expressions</strong> to schedule tasks at specific intervals.
        </p>
        <div className="explanation-cards">
          <div className="explanation-card">
            <div className="card-icon">🗑️</div>
            <h4>Cleanup Expired</h4>
            <p>Removes expired bot instances and cleans up database</p>
          </div>
          <div className="explanation-card">
            <div className="card-icon">🔄</div>
            <h4>Rotate Identities</h4>
            <p>Refreshes bot identities for randomized bots to avoid detection</p>
          </div>
          <div className="explanation-card">
            <div className="card-icon">💤</div>
            <h4>Deactivate Idle</h4>
            <p>Deactivates bots that haven't played in a while to save resources</p>
          </div>
          <div className="explanation-card">
            <div className="card-icon">🧪</div>
            <h4>Reset Test Bots</h4>
            <p>Resets test bot balances and states for testing purposes</p>
          </div>
          <div className="explanation-card">
            <div className="card-icon">📊</div>
            <h4>Health Check</h4>
            <p>Monitors bot system health and logs status reports</p>
          </div>
        </div>
        <div className="how-to-use">
          <h4>📖 How to Use:</h4>
          <ul>
            <li><strong>View Status:</strong> See which tasks are currently running (🟢) or stopped (🔴)</li>
            <li><strong>Trigger Manually:</strong> Click "▶️ Trigger" to run a task immediately (useful for testing)</li>
            <li><strong>Stop Task:</strong> Click "⏸️ Stop" to stop a running task</li>
            <li><strong>Reinitialize:</strong> Click "🔄 Reinitialize All" to restart all scheduled tasks</li>
            <li><strong>View Schedules:</strong> Check the table below to see when each task runs automatically</li>
          </ul>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading scheduler status...</div>
      ) : (
        <>
          {/* Task Status Grid */}
          <div className="scheduler-status">
            <h3>Task Status</h3>
            <div className="status-grid">
              {statuses.map(status => (
                <div key={status.name} className={`status-card ${status.running ? 'running' : 'stopped'}`}>
                  <div className="status-header">
                    <span className="status-icon">{getTaskIcon(status.name)}</span>
                    <span className={`status-indicator ${status.running ? 'active' : 'inactive'}`}>
                      {status.running ? '🟢' : '🔴'}
                    </span>
                  </div>
                  <h4>{status.name}</h4>
                  <p className="status-description">{status.description}</p>
                  <div className="status-actions">
                    <button
                      className="btn-trigger"
                      onClick={() => handleTriggerTask(status.name)}
                      disabled={triggering === status.name}
                    >
                      {triggering === status.name ? 'Running...' : '▶️ Trigger'}
                    </button>
                    {status.running && (
                      <button
                        className="btn-stop"
                        onClick={() => handleStopTask(status.name)}
                      >
                        ⏸️ Stop
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Details Table */}
          <div className="scheduler-tasks">
            <h3>Task Schedules</h3>
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Schedule (Cron)</th>
                  <th>Description</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.name}>
                    <td>
                      <div className="task-name">
                        <span className="task-icon">{getTaskIcon(task.name)}</span>
                        <span>{task.name}</span>
                      </div>
                    </td>
                    <td>
                      <code className="cron-expression">{task.schedule}</code>
                    </td>
                    <td>{task.description}</td>
                    <td className="task-details">{task.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cron Expression Guide */}
          <div className="scheduler-guide">
            <h3>📚 Cron Expression Guide</h3>
            <div className="guide-grid">
              <div className="guide-item">
                <code>* * * * *</code>
                <span>Every minute</span>
              </div>
              <div className="guide-item">
                <code>0 * * * *</code>
                <span>Every hour</span>
              </div>
              <div className="guide-item">
                <code>0 */6 * * *</code>
                <span>Every 6 hours</span>
              </div>
              <div className="guide-item">
                <code>0 2 * * *</code>
                <span>Daily at 2 AM</span>
              </div>
              <div className="guide-item">
                <code>0 3 * * 0</code>
                <span>Weekly (Sunday 3 AM)</span>
              </div>
              <div className="guide-item">
                <code>*/30 * * * *</code>
                <span>Every 30 minutes</span>
              </div>
            </div>
            <p className="guide-note">
              ℹ️ All times are in UTC timezone. Format: minute hour day month weekday
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default BotSchedulerPanel;
