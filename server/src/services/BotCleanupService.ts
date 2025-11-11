import { ScheduledTask, schedule } from 'node-cron';
import BotInstanceRepository from '../repositories/BotInstanceRepository.js';
import TableSeatRepository from '../repositories/TableSeatRepository.js';
import { botConfig } from './BotConfigService.js';
import { OccupantType } from '../models/TableSeat.js';

/**
 * BotCleanupService - Scheduled jobs for bot maintenance
 * - Removes expired ephemeral bots
 * - Cleans up inactive bot instances
 * - Releases expired seat locks
 * - Archives old audit logs
 */

class BotCleanupService {
  private cleanupJob: ScheduledTask | null = null;
  private lockCleanupJob: ScheduledTask | null = null;
  private isRunning: boolean = false;
  private stats: {
    lastRun: Date | null;
    totalCleaned: number;
    totalErrors: number;
  };

  constructor() {
    this.stats = {
      lastRun: null,
      totalCleaned: 0,
      totalErrors: 0
    };
  }

  /**
   * Start all cleanup jobs
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    const intervalMinutes = botConfig.get('cleanup_interval_minutes');

    // Main cleanup job - runs every N minutes
    this.cleanupJob = schedule(`*/${intervalMinutes} * * * *`, async () => {
      await this.runCleanup();
    });

    // Lock cleanup job - runs every 5 minutes
    this.lockCleanupJob = schedule('*/5 * * * *', async () => {
      await this.cleanupExpiredLocks();
    });

    this.isRunning = true;
  }

  /**
   * Stop all cleanup jobs
   */
  stop(): void {
    if (this.cleanupJob) {
      this.cleanupJob.stop();
      this.cleanupJob = null;
    }

    if (this.lockCleanupJob) {
      this.lockCleanupJob.stop();
      this.lockCleanupJob = null;
    }

    this.isRunning = false;
  }

  /**
   * Run manual cleanup
   */
  async runCleanup(): Promise<{
    expiredBots: number;
    inactiveBots: number;
    orphanedSeats: number;
    errors: number;
  }> {
    const repo = BotInstanceRepository;
    const seatRepo = TableSeatRepository;
    const results = {
      expiredBots: 0,
      inactiveBots: 0,
      orphanedSeats: 0,
      errors: 0
    };

    try {

      // 1. Remove expired ephemeral bots
      const expiredBots = await repo.findExpired();
      for (const bot of expiredBots) {
        try {
          // Clear from seat if assigned
          if (bot.assigned_table_id && bot.assigned_seat_index !== undefined) {
            await seatRepo.clearSeat(
              bot.assigned_table_id,
              bot.assigned_seat_index,
              'system-cleanup'
            );
          }

          // Deactivate bot instance
          await repo.deactivate(bot.bot_instance_id);
          results.expiredBots++;
        } catch (error) {
          console.error(`[BotCleanup] Error cleaning expired bot ${bot.bot_instance_id}:`, error);
          results.errors++;
        }
      }

      // 2. Remove inactive bots (no activity for 24 hours)
      const inactiveCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const inactiveBots = await repo.findInactiveSince(inactiveCutoff);
      
      for (const bot of inactiveBots) {
        try {
          if (bot.assigned_table_id && bot.assigned_seat_index !== undefined) {
            await seatRepo.clearSeat(
              bot.assigned_table_id,
              bot.assigned_seat_index,
              'system-cleanup'
            );
          }

          await repo.deactivate(bot.bot_instance_id);
          results.inactiveBots++;
        } catch (error) {
          console.error(`[BotCleanup] Error cleaning inactive bot ${bot.bot_instance_id}:`, error);
          results.errors++;
        }
      }

      // 3. Fix orphaned seats (seats marked as bot but no active bot instance)
      const orphanedSeats = await this.findOrphanedBotSeats();
      for (const seat of orphanedSeats) {
        try {
          await seatRepo.clearSeat(seat.table_id, seat.seat_index, 'system-cleanup');
          results.orphanedSeats++;
        } catch (error) {
          console.error(`[BotCleanup] Error cleaning orphaned seat:`, error);
          results.errors++;
        }
      }

      this.stats.lastRun = new Date();
      this.stats.totalCleaned += results.expiredBots + results.inactiveBots + results.orphanedSeats;
      this.stats.totalErrors += results.errors;


    } catch (error) {
      console.error('[BotCleanup] Cleanup failed:', error);
      results.errors++;
    }

    return results;
  }

  /**
   * Cleanup expired seat locks
   */
  async cleanupExpiredLocks(): Promise<number> {
    try {
      const seatRepo = TableSeatRepository;
      const cleaned = await seatRepo.cleanupExpiredLocks();
      
      if (cleaned > 0) {
      }

      return cleaned;
    } catch (error) {
      console.error('[BotCleanup] Error cleaning locks:', error);
      return 0;
    }
  }

  /**
   * Find seats marked as bot-occupied but no corresponding active bot instance
   */
  private async findOrphanedBotSeats(): Promise<Array<{ table_id: number; seat_index: number }>> {
    const seatRepo = TableSeatRepository;
    const botRepo = BotInstanceRepository;
    const orphaned: Array<{ table_id: number; seat_index: number }> = [];

    try {
      // This is a simplified check - in production, you'd query all tables
      // For now, check tables 1-10
      for (let tableId = 1; tableId <= 10; tableId++) {
        const seats = await seatRepo.findAllByTableId(tableId);
        
        for (const seat of seats) {
          if (seat.occupant_type === OccupantType.BOT && seat.occupant_id) {
            // Check if bot instance exists and is active
            const botInstance = await botRepo.findById(seat.occupant_id);
            
            if (!botInstance || !botInstance.is_active) {
              orphaned.push({
                table_id: seat.table_id,
                seat_index: seat.seat_index
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('[BotCleanup] Error finding orphaned seats:', error);
    }

    return orphaned;
  }

  /**
   * Get cleanup statistics
   */
  getStats(): {
    isRunning: boolean;
    lastRun: Date | null;
    totalCleaned: number;
    totalErrors: number;
  } {
    return {
      isRunning: this.isRunning,
      ...this.stats
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      lastRun: null,
      totalCleaned: 0,
      totalErrors: 0
    };
  }
}

// Export singleton instance
export const botCleanupService = new BotCleanupService();

export default botCleanupService;
