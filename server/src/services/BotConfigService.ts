/**
 * BotConfigService - Manages bot system feature flags and configuration
 * Allows hot-reload of settings without server restart
 */

interface BotSystemConfig {
  // Global feature flags
  bot_assignment_enabled: boolean;
  maintenance_mode: boolean;
  
  // Limits
  max_bots_per_table: number;
  max_total_active_bots: number;
  max_bot_assignments_per_hour: number;
  
  // Behavior settings
  allow_hot_reload: boolean;
  auto_cleanup_expired_bots: boolean;
  cleanup_interval_minutes: number;
  
  // Identity settings
  avatar_cooldown_minutes: number;
  name_collision_max_attempts: number;
  
  // Transparency settings
  require_bot_disclosure: boolean;
  show_bot_label_to_players: boolean;
  
  // Analytics
  track_bot_performance: boolean;
  anomaly_detection_enabled: boolean;
  high_winrate_threshold: number; // e.g., 0.70 = 70%
  
  // RNG Fairness
  enforce_rng_fairness_checks: boolean;
  log_bot_decisions: boolean;
  
  // Timing
  min_reaction_delay_ms: number;
  max_reaction_delay_ms: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: BotSystemConfig = {
  bot_assignment_enabled: true,
  maintenance_mode: false,
  
  max_bots_per_table: 4,
  max_total_active_bots: 100,
  max_bot_assignments_per_hour: 200,
  
  allow_hot_reload: true,
  auto_cleanup_expired_bots: true,
  cleanup_interval_minutes: 15,
  
  avatar_cooldown_minutes: 60,
  name_collision_max_attempts: 10,
  
  require_bot_disclosure: false,
  show_bot_label_to_players: false,
  
  track_bot_performance: true,
  anomaly_detection_enabled: true,
  high_winrate_threshold: 0.70,
  
  enforce_rng_fairness_checks: true,
  log_bot_decisions: false,
  
  min_reaction_delay_ms: 500,
  max_reaction_delay_ms: 5000
};

/**
 * Bot Configuration Manager
 */
class BotConfigManager {
  private config: BotSystemConfig;
  private listeners: Map<string, Array<(config: BotSystemConfig) => void>>;
  private lastReloadTime: Date;

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.listeners = new Map();
    this.lastReloadTime = new Date();
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<BotSystemConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Get specific config value
   */
  get<K extends keyof BotSystemConfig>(key: K): BotSystemConfig[K] {
    return this.config[key];
  }

  /**
   * Update configuration (hot-reload)
   */
  updateConfig(updates: Partial<BotSystemConfig>): void {
    if (!this.config.allow_hot_reload) {
      throw new Error('Hot-reload is disabled in current configuration');
    }

    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...updates };
    this.lastReloadTime = new Date();

    // Notify listeners of config change
    this.notifyListeners(oldConfig);
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.lastReloadTime = new Date();
    this.notifyListeners();
  }

  /**
   * Check if bot assignment is allowed
   */
  canAssignBots(): { allowed: boolean; reason?: string } {
    if (this.config.maintenance_mode) {
      return { allowed: false, reason: 'System is in maintenance mode' };
    }

    if (!this.config.bot_assignment_enabled) {
      return { allowed: false, reason: 'Bot assignment is currently disabled' };
    }

    return { allowed: true };
  }

  /**
   * Check if table can accept more bots
   */
  canAddBotToTable(currentBotCount: number): { allowed: boolean; reason?: string } {
    const assignmentCheck = this.canAssignBots();
    if (!assignmentCheck.allowed) {
      return assignmentCheck;
    }

    if (currentBotCount >= this.config.max_bots_per_table) {
      return {
        allowed: false,
        reason: `Table has reached max bot limit (${this.config.max_bots_per_table})`
      };
    }

    return { allowed: true };
  }

  /**
   * Check if system can add more active bots globally
   */
  canAddActiveBot(totalActiveBots: number): { allowed: boolean; reason?: string } {
    const assignmentCheck = this.canAssignBots();
    if (!assignmentCheck.allowed) {
      return assignmentCheck;
    }

    if (totalActiveBots >= this.config.max_total_active_bots) {
      return {
        allowed: false,
        reason: `System has reached max active bots limit (${this.config.max_total_active_bots})`
      };
    }

    return { allowed: true };
  }

  /**
   * Validate behavior profile timing parameters
   */
  validateReactionDelay(delayMs: number): number {
    if (delayMs < this.config.min_reaction_delay_ms) {
      return this.config.min_reaction_delay_ms;
    }
    if (delayMs > this.config.max_reaction_delay_ms) {
      return this.config.max_reaction_delay_ms;
    }
    return delayMs;
  }

  /**
   * Check if bot performance should be flagged as anomaly
   */
  isAnomalousPerformance(stats: {
    gamesPlayed: number;
    gamesWon: number;
    totalWinnings: number;
  }): { isAnomaly: boolean; reason?: string } {
    if (!this.config.anomaly_detection_enabled) {
      return { isAnomaly: false };
    }

    // Need minimum sample size
    if (stats.gamesPlayed < 50) {
      return { isAnomaly: false };
    }

    const winRate = stats.gamesWon / stats.gamesPlayed;

    // Check win rate anomaly
    if (winRate > this.config.high_winrate_threshold) {
      return {
        isAnomaly: true,
        reason: `Win rate ${(winRate * 100).toFixed(1)}% exceeds threshold ${(this.config.high_winrate_threshold * 100)}%`
      };
    }

    // Check excessive winnings
    const avgWinPerGame = stats.totalWinnings / stats.gamesPlayed;
    if (avgWinPerGame > 1000) { // Configurable threshold
      return {
        isAnomaly: true,
        reason: `Average win per game (${avgWinPerGame}) is unusually high`
      };
    }

    return { isAnomaly: false };
  }

  /**
   * Subscribe to config changes
   */
  onConfigChange(id: string, callback: (config: BotSystemConfig) => void): void {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, []);
    }
    this.listeners.get(id)!.push(callback);
  }

  /**
   * Unsubscribe from config changes
   */
  offConfigChange(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * Notify all listeners of config change
   */
  private notifyListeners(oldConfig?: BotSystemConfig): void {
    this.listeners.forEach(callbacks => {
      callbacks.forEach(callback => {
        try {
          callback(this.config);
        } catch (error) {
          console.error('Error in config change listener:', error);
        }
      });
    });
  }

  /**
   * Get configuration stats
   */
  getStats(): {
    lastReloadTime: Date;
    listenerCount: number;
    currentConfig: BotSystemConfig;
  } {
    return {
      lastReloadTime: this.lastReloadTime,
      listenerCount: this.listeners.size,
      currentConfig: { ...this.config }
    };
  }

  /**
   * Export configuration as JSON
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  importConfig(jsonConfig: string): void {
    try {
      const parsedConfig = JSON.parse(jsonConfig);
      this.updateConfig(parsedConfig);
    } catch (error) {
      throw new Error('Invalid configuration JSON');
    }
  }

  /**
   * Get maintenance mode status
   */
  isMaintenanceMode(): boolean {
    return this.config.maintenance_mode;
  }

  /**
   * Enable maintenance mode
   */
  enableMaintenanceMode(reason?: string): void {
    this.updateConfig({ maintenance_mode: true });
    console.log(`[BotConfig] Maintenance mode enabled${reason ? `: ${reason}` : ''}`);
  }

  /**
   * Disable maintenance mode
   */
  disableMaintenanceMode(): void {
    this.updateConfig({ maintenance_mode: false });
    console.log('[BotConfig] Maintenance mode disabled');
  }
}

// Export singleton instance
export const botConfig = new BotConfigManager();

// Export types
export type { BotSystemConfig };
export { DEFAULT_CONFIG };

export default botConfig;
