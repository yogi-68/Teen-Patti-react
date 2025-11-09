import express from 'express';
import { BotScheduler } from '../services/BotScheduler.js';

const router = express.Router();

/**
 * GET /api/admin/scheduler/status
 * Get status of all scheduled tasks
 */
router.get('/status', async (req, res) => {
  try {
    const status = BotScheduler.getStatus();
    const statusArray = Array.from(status.entries()).map(([name, running]) => ({
      name,
      running,
      description: getTaskDescription(name)
    }));

    res.json({
      success: true,
      tasks: statusArray,
      total: statusArray.length
    });
  } catch (error: any) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduler status',
      error: error.message
    });
  }
});

/**
 * POST /api/admin/scheduler/trigger/:taskName
 * Manually trigger a scheduled task
 */
router.post('/trigger/:taskName', async (req, res) => {
  try {
    const { taskName } = req.params;

    await BotScheduler.triggerTask(taskName);

    res.json({
      success: true,
      message: `Task "${taskName}" executed successfully`,
      taskName
    });
  } catch (error: any) {
    console.error('Error triggering task:', error);
    res.status(error.message.includes('Unknown task') ? 404 : 500).json({
      success: false,
      message: `Failed to trigger task: ${error.message}`,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/scheduler/stop/:taskName
 * Stop a specific scheduled task
 */
router.post('/stop/:taskName', async (req, res) => {
  try {
    const { taskName } = req.params;

    const stopped = BotScheduler.stopTask(taskName);

    if (!stopped) {
      return res.status(404).json({
        success: false,
        message: `Task "${taskName}" not found`
      });
    }

    res.json({
      success: true,
      message: `Task "${taskName}" stopped successfully`,
      taskName
    });
  } catch (error: any) {
    console.error('Error stopping task:', error);
    res.status(500).json({
      success: false,
      message: `Failed to stop task: ${error.message}`,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/scheduler/stop-all
 * Stop all scheduled tasks
 */
router.post('/stop-all', async (req, res) => {
  try {
    BotScheduler.stopAll();

    res.json({
      success: true,
      message: 'All scheduled tasks stopped'
    });
  } catch (error: any) {
    console.error('Error stopping all tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop all tasks',
      error: error.message
    });
  }
});

/**
 * POST /api/admin/scheduler/reinitialize
 * Reinitialize all scheduled tasks
 */
router.post('/reinitialize', async (req, res) => {
  try {
    // Stop all tasks first
    BotScheduler.stopAll();
    
    // Reinitialize
    BotScheduler.initialize();

    res.json({
      success: true,
      message: 'Scheduler reinitialized successfully'
    });
  } catch (error: any) {
    console.error('Error reinitializing scheduler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reinitialize scheduler',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/scheduler/tasks
 * Get list of available scheduled tasks with descriptions
 */
router.get('/tasks', (req, res) => {
  const tasks = [
    {
      name: 'cleanup-expired',
      schedule: '0 * * * *',
      description: 'Clean up expired bots (hourly)',
      details: 'Deactivates bots that have passed their expiration date'
    },
    {
      name: 'rotate-identities',
      schedule: '0 */6 * * *',
      description: 'Rotate bot identities (every 6 hours)',
      details: 'Changes display names and bot IDs for 20% of randomized bots'
    },
    {
      name: 'deactivate-idle',
      schedule: '0 2 * * *',
      description: 'Deactivate idle bots (daily at 2 AM)',
      details: 'Deactivates bots that haven\'t played in 7+ days'
    },
    {
      name: 'reset-test-bots',
      schedule: '0 3 * * 0',
      description: 'Reset test bot statistics (weekly on Sunday)',
      details: 'Clears analytics for bots with "Test" prefix'
    },
    {
      name: 'health-check',
      schedule: '*/30 * * * *',
      description: 'System health check (every 30 minutes)',
      details: 'Logs bot system metrics and status'
    }
  ];

  res.json({
    success: true,
    tasks
  });
});

/**
 * Helper function to get task description
 */
function getTaskDescription(taskName: string): string {
  const descriptions: { [key: string]: string } = {
    'cleanup-expired': 'Clean up expired bots (hourly)',
    'rotate-identities': 'Rotate bot identities (every 6 hours)',
    'deactivate-idle': 'Deactivate idle bots (daily at 2 AM)',
    'reset-test-bots': 'Reset test bot statistics (weekly)',
    'health-check': 'System health check (every 30 minutes)'
  };
  return descriptions[taskName] || 'Unknown task';
}

export default router;
