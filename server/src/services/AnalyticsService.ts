/**
 * Analytics Aggregation Service
 * Computes system-wide metrics and detects anomalies
 */

import BotInstanceRepository from '../repositories/BotInstanceRepository.js';
import TableSeatRepository from '../repositories/TableSeatRepository.js';
import { OccupantType, TableSeat } from '../models/TableSeat.js';

export interface SystemAnalytics {
  totalActiveBots: number;
  totalBotsCreated: number;
  tablesWithBots: number;
  averageBotsPerTable: number;
  winRateDistribution: {
    excellent: number;    // >60%
    good: number;         // 45-60%
    average: number;      // 30-45%
    poor: number;         // <30%
  };
  anomalies: BotAnomaly[];
}

export interface BotAnomaly {
  bot_instance_id: string;
  display_name: string;
  bot_id: string;
  issue_type: 'high_win_rate' | 'low_win_rate' | 'no_activity' | 'high_error_rate';
  severity: 'low' | 'medium' | 'high';
  metric_value: number;
  threshold: number;
  detected_at: Date;
  table_id?: number;
  seat_index?: number;
}

export interface TableAnalytics {
  table_id: number;
  total_seats: number;
  occupied_seats: number;
  bot_count: number;
  human_count: number;
  empty_count: number;
  bots: {
    bot_instance_id: string;
    display_name: string;
    bot_id: string;
    seat_index: number;
    games_played: number;
    games_won: number;
    win_rate: number;
  }[];
}

export interface WinRateAnalysis {
  bot_instance_id: string;
  display_name: string;
  bot_id: string;
  games_played: number;
  games_won: number;
  win_rate: number;
  total_winnings: number;
  is_anomaly: boolean;
  created_at: Date;
}

class AnalyticsService {
  /**
   * High win rate threshold for anomaly detection
   */
  private readonly HIGH_WIN_RATE_THRESHOLD = 0.70; // 70%
  private readonly LOW_WIN_RATE_THRESHOLD = 0.10;  // 10%
  private readonly MIN_GAMES_FOR_ANALYSIS = 10;     // Minimum games to consider for analysis
  private readonly INACTIVITY_HOURS = 24;           // Hours of no activity to flag

  /**
   * Get comprehensive system analytics
   */
  async getSystemAnalytics(): Promise<SystemAnalytics> {
    // Get all active bots
    const activeBots = await BotInstanceRepository.findAllActive();
    
    // Get all bots ever created
    const stats = await BotInstanceRepository.getStats();
    const allBotsCount = stats.total;

    // Get tables with bots
    const tablesWithBotsSet = new Set<number>();
    const allBots = await BotInstanceRepository.findAllActive();
    allBots.forEach((bot) => {
      if (bot.assigned_table_id !== undefined) {
        tablesWithBotsSet.add(bot.assigned_table_id);
      }
    });

    const tablesWithBots = tablesWithBotsSet.size;
    const averageBotsPerTable = tablesWithBots > 0 ? activeBots.length / tablesWithBots : 0;

    // Calculate win rate distribution
    const winRateDistribution = {
      excellent: 0,
      good: 0,
      average: 0,
      poor: 0
    };

    activeBots.forEach(bot => {
      if (bot.games_played >= this.MIN_GAMES_FOR_ANALYSIS) {
        const winRate = bot.games_won / bot.games_played;
        if (winRate > 0.60) winRateDistribution.excellent++;
        else if (winRate > 0.45) winRateDistribution.good++;
        else if (winRate > 0.30) winRateDistribution.average++;
        else winRateDistribution.poor++;
      }
    });

    // Detect anomalies
    const anomalies = await this.detectAnomalies();

    return {
      totalActiveBots: activeBots.length,
      totalBotsCreated: allBotsCount,
      tablesWithBots,
      averageBotsPerTable: Math.round(averageBotsPerTable * 100) / 100,
      winRateDistribution,
      anomalies
    };
  }

  /**
   * Detect bot anomalies (suspiciously high/low win rates, inactivity)
   */
  async detectAnomalies(): Promise<BotAnomaly[]> {
    const anomalies: BotAnomaly[] = [];
    const activeBots = await BotInstanceRepository.findAllActive();

    for (const bot of activeBots) {
      // Skip bots with insufficient games
      if (bot.games_played < this.MIN_GAMES_FOR_ANALYSIS) continue;

      const winRate = bot.games_won / bot.games_played;

      // Check for high win rate (potential exploit)
      if (winRate > this.HIGH_WIN_RATE_THRESHOLD) {
        anomalies.push({
          bot_instance_id: bot.bot_instance_id,
          display_name: bot.display_name,
          bot_id: bot.bot_id,
          issue_type: 'high_win_rate',
          severity: winRate > 0.80 ? 'high' : 'medium',
          metric_value: winRate,
          threshold: this.HIGH_WIN_RATE_THRESHOLD,
          detected_at: new Date(),
          table_id: bot.assigned_table_id,
          seat_index: bot.assigned_seat_index
        });
      }

      // Check for very low win rate (potential bug)
      if (winRate < this.LOW_WIN_RATE_THRESHOLD) {
        anomalies.push({
          bot_instance_id: bot.bot_instance_id,
          display_name: bot.display_name,
          bot_id: bot.bot_id,
          issue_type: 'low_win_rate',
          severity: 'low',
          metric_value: winRate,
          threshold: this.LOW_WIN_RATE_THRESHOLD,
          detected_at: new Date(),
          table_id: bot.assigned_table_id,
          seat_index: bot.assigned_seat_index
        });
      }

      // Check for inactivity
      if (bot.last_action_at) {
        const hoursSinceLastAction = (Date.now() - bot.last_action_at.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastAction > this.INACTIVITY_HOURS) {
          anomalies.push({
            bot_instance_id: bot.bot_instance_id,
            display_name: bot.display_name,
            bot_id: bot.bot_id,
            issue_type: 'no_activity',
            severity: 'low',
            metric_value: hoursSinceLastAction,
            threshold: this.INACTIVITY_HOURS,
            detected_at: new Date(),
            table_id: bot.assigned_table_id,
            seat_index: bot.assigned_seat_index
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Get analytics for a specific table
   */
  async getTableAnalytics(tableId: number): Promise<TableAnalytics> {
    const stats = await TableSeatRepository.getTableStats(tableId);
    const seats = await TableSeatRepository.findAllByTableId(tableId);

    const bots: TableAnalytics['bots'] = [];

    for (const seat of seats) {
      if (seat.occupant_type === OccupantType.BOT && seat.occupant_id) {
        const botInstance = await BotInstanceRepository.findById(seat.occupant_id);
        if (botInstance) {
          bots.push({
            bot_instance_id: botInstance.bot_instance_id,
            display_name: botInstance.display_name,
            bot_id: botInstance.bot_id,
            seat_index: seat.seat_index,
            games_played: botInstance.games_played,
            games_won: botInstance.games_won,
            win_rate: botInstance.games_played > 0 
              ? Math.round((botInstance.games_won / botInstance.games_played) * 100) / 100
              : 0
          });
        }
      }
    }

    return {
      table_id: tableId,
      total_seats: stats.total || 0,
      occupied_seats: stats.human + stats.bot,
      bot_count: stats.bot || 0,
      human_count: stats.human || 0,
      empty_count: stats.empty || 0,
      bots
    };
  }

  /**
   * Get win rate analysis for all bots
   */
  async getWinRateAnalysis(): Promise<WinRateAnalysis[]> {
    const allBots = await BotInstanceRepository.findAllActive();

    return allBots
      .filter(bot => bot.games_played > 0)
      .map(bot => {
        const winRate = bot.games_won / bot.games_played;
        const isAnomaly = 
          (bot.games_played >= this.MIN_GAMES_FOR_ANALYSIS) &&
          (winRate > this.HIGH_WIN_RATE_THRESHOLD || winRate < this.LOW_WIN_RATE_THRESHOLD);

        return {
          bot_instance_id: bot.bot_instance_id,
          display_name: bot.display_name,
          bot_id: bot.bot_id,
          games_played: bot.games_played,
          games_won: bot.games_won,
          win_rate: Math.round(winRate * 100) / 100,
          total_winnings: bot.total_winnings,
          is_anomaly: isAnomaly,
          created_at: bot.created_at
        };
      })
      .sort((a, b) => b.win_rate - a.win_rate); // Sort by win rate descending
  }

  /**
   * Get bots with suspicious activity (for admin review)
   */
  async getSuspiciousBots(): Promise<WinRateAnalysis[]> {
    const analysis = await this.getWinRateAnalysis();
    return analysis.filter(bot => bot.is_anomaly);
  }

  /**
   * Get performance metrics for monitoring
   */
  async getPerformanceMetrics() {
    const activeBots = await BotInstanceRepository.findAllActive();
    
    const totalGamesPlayed = activeBots.reduce((sum, bot) => sum + bot.games_played, 0);
    const totalGamesWon = activeBots.reduce((sum, bot) => sum + bot.games_won, 0);
    const totalWinnings = activeBots.reduce((sum, bot) => sum + bot.total_winnings, 0);

    const averageWinRate = totalGamesPlayed > 0 ? totalGamesWon / totalGamesPlayed : 0;

    return {
      active_bots: activeBots.length,
      total_games_played: totalGamesPlayed,
      total_games_won: totalGamesWon,
      average_win_rate: Math.round(averageWinRate * 100) / 100,
      total_winnings: totalWinnings,
      anomaly_count: (await this.detectAnomalies()).length
    };
  }
}

export default new AnalyticsService();
