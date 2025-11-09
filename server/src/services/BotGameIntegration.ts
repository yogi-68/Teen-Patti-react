import { BotInstanceRepository } from '../repositories/BotInstanceRepository.js';
import { BotBlueprintRepository } from '../repositories/BotBlueprintRepository.js';
import { BotActionExecutor } from './BotActionExecutor.js';
import { BotInstance } from '../models/BotInstance.js';
import { BehaviorProfile } from '../models/BotBlueprint.js';
import { Table } from '../models/Table.js';
import { Player } from '../models/Player.js';
import { BotDecision } from './BotDecisionEngine.js';

/**
 * Bot Game Integration Service
 * Manages bot participation in active games
 */
export class BotGameIntegration {
  private static botInstanceRepo = new BotInstanceRepository();
  private static botBlueprintRepo = new BotBlueprintRepository();
  
  // Cache bot instances and their behavior profiles
  private static botCache = new Map<string, { botInstance: BotInstance; behaviorProfile: BehaviorProfile }>();
  
  /**
   * Check if a player is a bot and should act
   */
  static async shouldBotActNow(tableId: number, player: Player): Promise<boolean> {
    if (!player.turn || player.folded || !player.connected) {
      return false;
    }

    // Check if this player is a bot
    const botInstance = await this.getBotInstanceForPlayer(tableId, player.id);
    return botInstance !== null;
  }

  /**
   * Execute bot turn in the game
   * This should be called after nextTurn() moves to a bot player
   */
  static async executeBotTurn(
    tableId: number,
    player: Player,
    gameService: any,
    socketHandler: any
  ): Promise<boolean> {
    try {
      // Get bot instance and behavior profile
      const botData = await this.getBotDataForPlayer(tableId, player.id);
      if (!botData) {
        console.log(`⚠️ No bot data found for player ${player.id} at table ${tableId}`);
        return false;
      }

      const { botInstance, behaviorProfile } = botData;

      // Get table from game service
      const table = gameService.getTable(tableId);
      if (!table) {
        console.log(`⚠️ Table ${tableId} not found`);
        return false;
      }

      // Decide what action to take
      console.log(`🤖 Bot ${botInstance.display_name} is making a decision...`);
      const decision = await BotActionExecutor.decideBotAction(
        botInstance,
        behaviorProfile,
        table,
        player
      );

      // Execute the decision through game service
      await this.executeDecisionThroughGameService(
        tableId,
        player.id,
        botInstance,
        decision,
        gameService,
        socketHandler
      );

      return true;
    } catch (error) {
      console.error(`Error executing bot turn:`, error);
      return false;
    }
  }

  /**
   * Execute bot decision using GameService methods
   */
  private static async executeDecisionThroughGameService(
    tableId: number,
    playerId: string,
    botInstance: BotInstance,
    decision: any,
    gameService: any,
    socketHandler: any
  ): Promise<void> {
    const table = gameService.getTable(tableId);
    if (!table) return;

    const player = table.getPlayer(playerId);
    if (!player) return;

    console.log(`🤖 Bot ${botInstance.display_name} executing: ${decision.decision}`);

    switch (decision.decision) {
      case BotDecision.FOLD:
        await this.executeBotFold(tableId, playerId, botInstance, gameService, socketHandler);
        break;

      case BotDecision.BET_BLIND:
      case BotDecision.BET_CHAAL:
        await this.executeBotBet(
          tableId,
          playerId,
          decision.betAmount || table.lastBet,
          decision.decision === BotDecision.BET_BLIND,
          botInstance,
          gameService,
          socketHandler
        );
        break;

      case BotDecision.SEE_CARDS:
        await this.executeBotSeeCards(tableId, playerId, botInstance, gameService, socketHandler);
        // After seeing cards, make another decision immediately
        setTimeout(() => {
          this.executeBotTurn(tableId, player, gameService, socketHandler);
        }, 1000); // 1 second delay after seeing cards
        break;

      case BotDecision.SHOW:
        await this.executeBotShow(tableId, playerId, botInstance, gameService, socketHandler);
        break;

      default:
        console.warn(`Unknown bot decision: ${decision.decision}`);
    }
  }

  /**
   * Execute bot fold
   */
  private static async executeBotFold(
    tableId: number,
    playerId: string,
    botInstance: BotInstance,
    gameService: any,
    socketHandler: any
  ): Promise<void> {
    const table = gameService.getTable(tableId);
    const player = table?.getPlayer(playerId);
    const playerName = botInstance.display_name;

    const result = gameService.handleFold(tableId, playerId);

    if (result.success && table) {
      // Emit events
      socketHandler.getIO().to(`table_${tableId}`).emit('tableUpdate', table.getTableState());
      socketHandler.getIO().to(`table_${tableId}`).emit('playerFolded', {
        playerId,
        playerName
      });
      socketHandler.getIO().to(`table_${tableId}`).emit('notification', {
        message: `🤖 ${playerName} folded`,
        type: 'info'
      });

      // Emit bot action
      socketHandler.emitBotAction(tableId, 'fold', botInstance, {});

      // Check if game is over
      if (result.gameOver && result.winner) {
        await this.handleBotGameCompletion(tableId, result.winner, 'All other players folded', socketHandler, gameService);
      } else {
        // Start timer for next player (or execute next bot turn)
        await this.handleNextPlayerTurn(tableId, gameService, socketHandler);
      }
    }
  }

  /**
   * Execute bot bet
   */
  private static async executeBotBet(
    tableId: number,
    playerId: string,
    betAmount: number,
    isBlind: boolean,
    botInstance: BotInstance,
    gameService: any,
    socketHandler: any
  ): Promise<void> {
    const table = gameService.getTable(tableId);
    const player = table?.getPlayer(playerId);
    
    // Check balance
    if (player && player.playerInfo.chips < betAmount) {
      console.log(`⚠️ Bot ${botInstance.display_name} has insufficient chips (${player.playerInfo.chips} < ${betAmount})`);
      // Bot folds instead
      await this.executeBotFold(tableId, playerId, botInstance, gameService, socketHandler);
      return;
    }

    const result = gameService.handleBet(tableId, playerId, betAmount, isBlind);

    if (result.success && table) {
      // Emit events
      socketHandler.getIO().to(`table_${tableId}`).emit('tableUpdate', table.getTableState());
      socketHandler.getIO().to(`table_${tableId}`).emit('playerBet', {
        playerId,
        amount: betAmount,
        isBlind
      });
      socketHandler.getIO().to(`table_${tableId}`).emit('notification', {
        message: `🤖 ${botInstance.display_name} bet ${betAmount} (${isBlind ? 'blind' : 'chaal'})`,
        type: 'info'
      });

      // Emit bot action
      socketHandler.emitBotAction(tableId, isBlind ? 'bet_blind' : 'bet_chaal', botInstance, {
        amount: betAmount
      });

      // Check if pot limit exceeded
      if (result.potLimitExceeded) {
        console.log('🎯 Pot limit exceeded! Triggering automatic show...');
        socketHandler.getIO().to(`table_${tableId}`).emit('potLimitExceeded', {
          pot: table.pot,
          potLimit: table.config.potLimit
        });
        
        // Trigger automatic show after delay
        setTimeout(() => {
          this.executeBotShow(tableId, playerId, botInstance, gameService, socketHandler);
        }, 2000);
      } else {
        // Move to next player
        await this.handleNextPlayerTurn(tableId, gameService, socketHandler);
      }
    }
  }

  /**
   * Execute bot see cards
   */
  private static async executeBotSeeCards(
    tableId: number,
    playerId: string,
    botInstance: BotInstance,
    gameService: any,
    socketHandler: any
  ): Promise<void> {
    const result = gameService.handleSeeCards(tableId, playerId);

    if (result.success) {
      const table = gameService.getTable(tableId);
      if (table) {
        socketHandler.getIO().to(`table_${tableId}`).emit('tableUpdate', table.getTableState());
        socketHandler.getIO().to(`table_${tableId}`).emit('playerSawCards', {
          playerId
        });
        socketHandler.getIO().to(`table_${tableId}`).emit('notification', {
          message: `🤖 ${botInstance.display_name} saw their cards`,
          type: 'info'
        });

        // Emit bot action
        socketHandler.emitBotAction(tableId, 'see_cards', botInstance, {});
      }
    }
  }

  /**
   * Execute bot show
   */
  private static async executeBotShow(
    tableId: number,
    playerId: string,
    botInstance: BotInstance,
    gameService: any,
    socketHandler: any
  ): Promise<void> {
    const result = gameService.handleShow(tableId, playerId);

    if (result.success) {
      const table = gameService.getTable(tableId);
      if (table && result.results) {
        socketHandler.getIO().to(`table_${tableId}`).emit('tableUpdate', table.getTableState());
        socketHandler.getIO().to(`table_${tableId}`).emit('showdown', result.results);

        // Emit bot action
        socketHandler.emitBotAction(tableId, 'show', botInstance, {});

        if (result.winner) {
          await this.handleBotGameCompletion(tableId, result.winner, 'Showdown', socketHandler, gameService);
        }
      }
    }
  }

  /**
   * Handle next player's turn (bot or human)
   */
  private static async handleNextPlayerTurn(
    tableId: number,
    gameService: any,
    socketHandler: any
  ): Promise<void> {
    const table = gameService.getTable(tableId);
    if (!table) return;

    const nextPlayer = table.getPlayers().find((p: Player) => p.turn);
    if (!nextPlayer) return;

    // Check if next player is a bot
    const isBot = await this.shouldBotActNow(tableId, nextPlayer);

    if (isBot) {
      // Bot's turn - execute immediately after a delay
      console.log(`🤖 Next player is a bot, executing turn automatically...`);
      setTimeout(() => {
        this.executeBotTurn(tableId, nextPlayer, gameService, socketHandler);
      }, 1500); // 1.5 second delay before bot acts
    } else {
      // Human player's turn - start turn timer
      console.log(`👤 Next player is human (${nextPlayer.id}), starting turn timer`);
      // The SocketHandler will handle the turn timer for human players
    }
  }

  /**
   * Handle game completion (update bot stats)
   */
  private static async handleBotGameCompletion(
    tableId: number,
    winner: Player,
    reason: string,
    socketHandler: any,
    gameService: any
  ): Promise<void> {
    // Emit game over events (similar to SocketHandler.handleGameCompletion)
    const table = gameService.getTable(tableId);
    if (!table) return;

    socketHandler.getIO().to(`table_${tableId}`).emit('gameOver', {
      winner: {
        playerId: winner.id,
        playerName: winner.playerInfo.userName,
        chips: winner.playerInfo.chips
      },
      pot: table.pot,
      reason
    });

    // Update bot statistics if winner is a bot
    const winnerBotData = await this.getBotDataForPlayer(tableId, winner.id);
    if (winnerBotData) {
      await this.updateBotStats(winnerBotData.botInstance, true, table.pot);
    }

    // Update stats for all bots that participated
    for (const player of table.getPlayers()) {
      if (player.id !== winner.id) {
        const botData = await this.getBotDataForPlayer(tableId, player.id);
        if (botData) {
          await this.updateBotStats(botData.botInstance, false, 0);
        }
      }
    }
  }

  /**
   * Update bot statistics after a game
   */
  private static async updateBotStats(
    botInstance: BotInstance,
    won: boolean,
    winnings: number
  ): Promise<void> {
    // TODO: Implement in Task 6 (Bot Analytics)
    console.log(`📊 Bot ${botInstance.display_name} game complete - Won: ${won}, Winnings: ${winnings}`);
  }

  /**
   * Get bot instance for a player
   */
  private static async getBotInstanceForPlayer(
    tableId: number,
    playerId: string
  ): Promise<BotInstance | null> {
    try {
      // Check if this player ID is actually a bot instance ID
      const instances = await this.botInstanceRepo.findByTableId(tableId);
      
      // Find bot instance where the player ID matches
      // Note: This assumes player.id is set to bot_instance_id when bot joins
      const botInstance = instances.find(b => b.bot_instance_id === playerId);
      
      return botInstance || null;
    } catch (error) {
      console.error('Error getting bot instance:', error);
      return null;
    }
  }

  /**
   * Get bot instance and behavior profile
   */
  private static async getBotDataForPlayer(
    tableId: number,
    playerId: string
  ): Promise<{ botInstance: BotInstance; behaviorProfile: BehaviorProfile } | null> {
    try {
      // Check cache first
      const cacheKey = `${tableId}:${playerId}`;
      if (this.botCache.has(cacheKey)) {
        return this.botCache.get(cacheKey)!;
      }

      // Get bot instance
      const botInstance = await this.getBotInstanceForPlayer(tableId, playerId);
      if (!botInstance) return null;

      // Get behavior profile from blueprint
      const blueprint = await this.botBlueprintRepo.findById(botInstance.bot_blueprint_id);
      if (!blueprint) return null;

      const data = {
        botInstance,
        behaviorProfile: blueprint.behavior_profile
      };

      // Cache it
      this.botCache.set(cacheKey, data);

      return data;
    } catch (error) {
      console.error('Error getting bot data:', error);
      return null;
    }
  }

  /**
   * Clear cache for a table (call when game ends)
   */
  static clearTableCache(tableId: number): void {
    for (const key of this.botCache.keys()) {
      if (key.startsWith(`${tableId}:`)) {
        this.botCache.delete(key);
      }
    }
  }
}
