import type { GameService } from './GameService.js';
import type { Table } from '../models/Table.js';
import { GameMode, GameState } from '../models/Table.js';
import { autonomousBotService } from './AutonomousBotService.js';

/**
 * Service that monitors game lobbies and automatically populates them with bots
 * Only works for PRACTICE mode (free coins)
 */
export class LobbyMonitorService {
  private gameService: GameService;
  private monitorInterval: NodeJS.Timeout | null = null;
  private readonly MONITOR_INTERVAL_MS = 5000; // Check every 5 seconds
  private readonly MIN_PLAYERS_FOR_GAME = 2; // Minimum players to start a game
  private readonly MAX_BOTS_PER_TABLE = 4; // Maximum bots per table
  private readonly TARGET_PLAYERS = 3; // Target number of players (humans + bots)

  constructor(gameService: GameService) {
    this.gameService = gameService;
  }

  /**
   * Start monitoring lobbies and auto-populating with bots
   */
  startMonitoring(): void {
    if (this.monitorInterval) {
      console.log('⚠️ Lobby monitor already running');
      return;
    }

    console.log('🤖 Starting lobby monitor service...');
    this.monitorInterval = setInterval(() => {
      this.checkAndPopulateLobbies();
    }, this.MONITOR_INTERVAL_MS);

    // Run immediately on start
    this.checkAndPopulateLobbies();
  }

  /**
   * Stop monitoring lobbies
   */
  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      console.log('🛑 Lobby monitor stopped');
    }
  }

  /**
   * Check all practice mode tables and add bots if needed
   */
  private checkAndPopulateLobbies(): void {
    const practiceTables = this.gameService.getTablesByMode(GameMode.PRACTICE);

    for (const table of practiceTables) {
      this.populateTableIfNeeded(table);
    }
  }

  /**
   * Populate a table with bots if it needs more players
   */
  private populateTableIfNeeded(table: Table): void {
    const players = table.getPlayers();
    const totalPlayers = players.length;
    const humanCount = autonomousBotService.getHumanPlayerCount(table);
    const botCount = autonomousBotService.getTableBots(table).length;

    // Only add bots if:
    // 1. Game is in WAITING state (not currently playing)
    // 2. There's at least 1 human player
    // 3. Total players is below target
    // 4. Bot count is below maximum
    if (
      table.gameState === GameState.WAITING &&
      humanCount > 0 &&
      totalPlayers < this.TARGET_PLAYERS &&
      botCount < this.MAX_BOTS_PER_TABLE
    ) {
      const botsToAdd = Math.min(
        this.TARGET_PLAYERS - totalPlayers,
        this.MAX_BOTS_PER_TABLE - botCount
      );

      for (let i = 0; i < botsToAdd; i++) {
        this.addBotToTable(table);
      }

      console.log(`🤖 Added ${botsToAdd} bot(s) to table ${table.id} (Humans: ${humanCount}, Bots: ${botCount + botsToAdd})`);
    }
  }

  /**
   * Add a bot player to a table
   */
  private addBotToTable(table: Table): boolean {
    try {
      // Generate bot with same chip amount as table boot amount * 100
      const botChips = table.config.bootAmount * 100;
      const botInfo = autonomousBotService.generateBot(botChips);

      // Create a fake socket ID for the bot
      const botSocketId = `bot_socket_${botInfo.userId}`;

      // Add bot to table
      const player = table.addPlayer(botInfo.userId!, botInfo, botSocketId);

      if (!player) {
        console.error('❌ Failed to add bot to table (table might be full)');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error adding bot to table:', error);
      return false;
    }
  }

  /**
   * Remove bots from a table when enough humans join
   * Remove the most recently added bot first
   */
  removeBotsIfTooMany(table: Table): string[] {
    const humanCount = autonomousBotService.getHumanPlayerCount(table);
    const bots = autonomousBotService.getTableBots(table);
    const removedBotIds: string[] = [];

    // If we have enough humans for a good game, start removing bots
    if (humanCount >= this.TARGET_PLAYERS && bots.length > 0) {
      // Remove all bots
      for (const bot of bots) {
        table.removePlayer(bot.id);
        autonomousBotService.releaseBotName(bot.playerInfo.userName);
        removedBotIds.push(bot.id);
      }
      console.log(`🤖 Removed ${removedBotIds.length} bot(s) from table ${table.id} (enough humans joined)`);
    } else if (table.getPlayers().length > table.config.maxPlayers - 1 && bots.length > 0) {
      // If table is almost full, remove one bot to make room
      const botToRemove = bots[bots.length - 1]; // Remove most recent bot
      table.removePlayer(botToRemove.id);
      autonomousBotService.releaseBotName(botToRemove.playerInfo.userName);
      removedBotIds.push(botToRemove.id);
      console.log(`🤖 Removed 1 bot from table ${table.id} to make room for human player`);
    }

    return removedBotIds;
  }

  /**
   * Check if a table needs bots immediately (when a human joins)
   */
  checkTableOnHumanJoin(table: Table): void {
    if (table.config.gameMode !== GameMode.PRACTICE) {
      return; // Only for practice mode
    }

    this.populateTableIfNeeded(table);
  }

  /**
   * Clean up bots when a human leaves
   */
  checkTableOnHumanLeave(table: Table): void {
    if (table.config.gameMode !== GameMode.PRACTICE) {
      return;
    }

    const humanCount = autonomousBotService.getHumanPlayerCount(table);
    
    // If no humans left, remove all bots
    if (humanCount === 0) {
      const bots = autonomousBotService.getTableBots(table);
      for (const bot of bots) {
        table.removePlayer(bot.id);
        autonomousBotService.releaseBotName(bot.playerInfo.userName);
      }
      if (bots.length > 0) {
        console.log(`🤖 Removed all ${bots.length} bot(s) from table ${table.id} (no humans left)`);
      }
    }
  }
}

export let lobbyMonitorService: LobbyMonitorService | null = null;

/**
 * Initialize the lobby monitor service
 */
export function initializeLobbyMonitor(gameService: GameService): LobbyMonitorService {
  lobbyMonitorService = new LobbyMonitorService(gameService);
  lobbyMonitorService.startMonitoring();
  return lobbyMonitorService;
}
