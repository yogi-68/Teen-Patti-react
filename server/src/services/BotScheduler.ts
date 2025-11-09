import * as cron from 'node-cron';
import BotInstanceRepository from '../repositories/BotInstanceRepository.js';
import { generateBotIdentity } from '../services/BotIdentityService.js';
import SocketService from '../services/SocketService.js';

/**
 * Bot Scheduler Service
 * Manages automated maintenance tasks for bot system
 */
export class BotScheduler {
  private static botInstanceRepo = BotInstanceRepository;
  private static scheduledTasks: Map<string, cron.ScheduledTask> = new Map();
  private static isInitialized = false;

  /**
   * Initialize all scheduled tasks
   */
  static initialize(): void {
    if (this.isInitialized) {
      console.log('⏰ Bot Scheduler already initialized');
      return;
    }

    console.log('⏰ Initializing Bot Scheduler...');

    // Task 1: Clean up expired bots (every hour)
    this.scheduleTask('cleanup-expired', '0 * * * *', () => {
      this.cleanupExpiredBots();
    });

    // Task 2: Rotate bot identities (every 6 hours)
    this.scheduleTask('rotate-identities', '0 */6 * * *', () => {
      this.rotateRandomBotIdentities();
    });

    // Task 3: Deactivate idle bots (every day at 2 AM)
    this.scheduleTask('deactivate-idle', '0 2 * * *', () => {
      this.deactivateIdleBots();
    });

    // Task 4: Clear analytics for test bots (every Sunday at 3 AM)
    this.scheduleTask('reset-test-bots', '0 3 * * 0', () => {
      this.resetTestBotStats();
    });

    // Task 5: Health check & logging (every 30 minutes)
    this.scheduleTask('health-check', '*/30 * * * *', () => {
      this.performHealthCheck();
    });

    this.isInitialized = true;
    console.log('✅ Bot Scheduler initialized with 5 tasks');
  }

  /**
   * Schedule a task
   */
  private static scheduleTask(
    name: string,
    cronExpression: string,
    task: () => void | Promise<void>
  ): void {
    const scheduledTask = cron.schedule(
      cronExpression,
      async () => {
        console.log(`⏰ Running scheduled task: ${name}`);
        try {
          await task();
        } catch (error) {
          console.error(`❌ Error in scheduled task ${name}:`, error);
        }
      },
      {
        timezone: 'UTC'
      }
    );

    this.scheduledTasks.set(name, scheduledTask);
    console.log(`📅 Scheduled task: ${name} (${cronExpression})`);
  }

  /**
   * Task 1: Clean up expired bots
   * Removes bots that have passed their expiration date
   */
  private static async cleanupExpiredBots(): Promise<void> {
    try {
      const allBots = await this.botInstanceRepo.findAllActive();
      const now = new Date();
      let expiredCount = 0;

      for (const bot of allBots) {
        if (bot.expires_at && new Date(bot.expires_at) < now) {
          console.log(`🗑️ Expiring bot: ${bot.display_name} (${bot.bot_instance_id})`);
          
          await this.botInstanceRepo.update(bot.bot_instance_id, {
            is_active: false
          });

          // Emit socket event if bot was assigned to a table
          if (bot.assigned_table_id !== undefined) {
            const socketHandler = SocketService.getSocketHandler();
            if (socketHandler) {
              socketHandler.emitBotRemoved(
                bot.assigned_table_id,
                bot.assigned_seat_index || 0,
                bot.bot_instance_id
              );
            }
          }

          expiredCount++;
        }
      }

      if (expiredCount > 0) {
        console.log(`✅ Cleaned up ${expiredCount} expired bot(s)`);
      }
    } catch (error) {
      console.error('Error cleaning up expired bots:', error);
    }
  }

  /**
   * Task 2: Rotate bot identities
   * Changes display names and bot IDs for random bots
   */
  private static async rotateRandomBotIdentities(): Promise<void> {
    try {
      const activeBots = await this.botInstanceRepo.findAllActive();
      
      // Only rotate bots that were randomized initially
      const rotatableBots = activeBots.filter(b => b.randomized);
      
      if (rotatableBots.length === 0) {
        console.log('ℹ️ No bots available for identity rotation');
        return;
      }

      // Rotate 20% of randomized bots (minimum 1, maximum 10)
      const rotateCount = Math.max(1, Math.min(10, Math.ceil(rotatableBots.length * 0.2)));
      const botsToRotate = this.shuffleArray(rotatableBots).slice(0, rotateCount);

      for (const bot of botsToRotate) {
        const newIdentity = await generateBotIdentity();
        
        await this.botInstanceRepo.update(bot.bot_instance_id, {
          display_name: newIdentity.displayName,
          bot_id: newIdentity.botId
        });

        console.log(`🔄 Rotated identity: ${bot.display_name} → ${newIdentity.displayName}`);

        // Emit socket event if bot is assigned
        if (bot.assigned_table_id !== undefined) {
          const socketHandler = SocketService.getSocketHandler();
          if (socketHandler) {
            socketHandler.emitBotIdentityRotated(
              bot.assigned_table_id,
              bot.assigned_seat_index || 0,
              bot.bot_instance_id,
              {
                old_identity: {
                  display_name: bot.display_name,
                  bot_id: bot.bot_id
                },
                new_identity: {
                  display_name: newIdentity.displayName,
                  bot_id: newIdentity.botId
                }
              }
            );
          }
        }
      }

      console.log(`✅ Rotated identities for ${rotateCount} bot(s)`);
    } catch (error) {
      console.error('Error rotating bot identities:', error);
    }
  }

  /**
   * Task 3: Deactivate idle bots
   * Deactivates bots that haven't played in 7+ days
   */
  private static async deactivateIdleBots(): Promise<void> {
    try {
      const allBots = await this.botInstanceRepo.findAllActive();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let deactivatedCount = 0;

      for (const bot of allBots) {
        // Skip bots without last_game_at (never played)
        if (!bot.last_game_at) continue;

        const lastGame = new Date(bot.last_game_at);
        
        if (lastGame < sevenDaysAgo) {
          console.log(`💤 Deactivating idle bot: ${bot.display_name} (last game: ${lastGame.toISOString()})`);
          
          await this.botInstanceRepo.update(bot.bot_instance_id, {
            is_active: false
          });

          deactivatedCount++;
        }
      }

      if (deactivatedCount > 0) {
        console.log(`✅ Deactivated ${deactivatedCount} idle bot(s)`);
      }
    } catch (error) {
      console.error('Error deactivating idle bots:', error);
    }
  }

  /**
   * Task 4: Reset test bot statistics
   * Clears analytics for bots created for testing purposes
   */
  private static async resetTestBotStats(): Promise<void> {
    try {
      // Reset stats for bots with specific test prefixes
      const allBots = await this.botInstanceRepo.findAllActive();
      const testBots = allBots.filter(b => 
        b.display_name.includes('Test') || 
        b.bot_id.startsWith('TEST-')
      );

      if (testBots.length === 0) {
        console.log('ℹ️ No test bots found for stat reset');
        return;
      }

      // Note: This would require a new method in repository
      // For now, we'll just log
      console.log(`ℹ️ Would reset stats for ${testBots.length} test bot(s)`);
      // TODO: Implement resetStats() method in BotInstanceRepository
    } catch (error) {
      console.error('Error resetting test bot stats:', error);
    }
  }

  /**
   * Task 5: Health check
   * Logs bot system health metrics
   */
  private static async performHealthCheck(): Promise<void> {
    try {
      const stats = await this.botInstanceRepo.getStats();
      
      console.log('📊 Bot System Health Check:');
      console.log(`   Total Bots: ${stats.total}`);
      console.log(`   Active Bots: ${stats.active}`);
      console.log(`   Tables with Bots: ${stats.byTable.size}`);
      
      stats.byTable.forEach((count, tableId) => {
        console.log(`   - Table ${tableId}: ${count} bot(s)`);
      });
    } catch (error) {
      console.error('Error performing health check:', error);
    }
  }

  /**
   * Stop a specific scheduled task
   */
  static stopTask(taskName: string): boolean {
    const task = this.scheduledTasks.get(taskName);
    if (task) {
      task.stop();
      this.scheduledTasks.delete(taskName);
      console.log(`⏸️ Stopped scheduled task: ${taskName}`);
      return true;
    }
    return false;
  }

  /**
   * Stop all scheduled tasks
   */
  static stopAll(): void {
    this.scheduledTasks.forEach((task, name) => {
      task.stop();
      console.log(`⏸️ Stopped scheduled task: ${name}`);
    });
    this.scheduledTasks.clear();
    this.isInitialized = false;
    console.log('⏸️ All scheduled tasks stopped');
  }

  /**
   * Get status of all scheduled tasks
   */
  static getStatus(): Map<string, boolean> {
    const status = new Map<string, boolean>();
    this.scheduledTasks.forEach((task, name) => {
      // node-cron doesn't expose running status directly, assume running if in map
      status.set(name, true);
    });
    return status;
  }

  /**
   * Manually trigger a task (for testing)
   */
  static async triggerTask(taskName: string): Promise<void> {
    console.log(`🔧 Manually triggering task: ${taskName}`);
    
    switch (taskName) {
      case 'cleanup-expired':
        await this.cleanupExpiredBots();
        break;
      case 'rotate-identities':
        await this.rotateRandomBotIdentities();
        break;
      case 'deactivate-idle':
        await this.deactivateIdleBots();
        break;
      case 'reset-test-bots':
        await this.resetTestBotStats();
        break;
      case 'health-check':
        await this.performHealthCheck();
        break;
      default:
        throw new Error(`Unknown task: ${taskName}`);
    }
  }

  /**
   * Helper: Shuffle array
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
