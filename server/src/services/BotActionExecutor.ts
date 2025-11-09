import { BotDecisionEngine, DecisionContext, DecisionResult, BotDecision } from './BotDecisionEngine.js';
import { BotInstance } from '../models/BotInstance.js';
import { BehaviorProfile } from '../models/BotBlueprint.js';
import { Table } from '../models/Table.js';
import { Player } from '../models/Player.js';
import SocketService from './SocketService.js';

/**
 * Bot Action Executor
 * Executes bot decisions using Table methods
 * 
 * NOTE: This service provides the decision logic for bots.
 * The actual game action execution should be done through the existing
 * GameService instance in the socket handlers.
 */
export class BotActionExecutor {
  /**
   * Analyze game state and decide what action a bot should take
   * Returns the decision for the game loop to execute
   */
  static async decideBotAction(
    botInstance: BotInstance,
    behaviorProfile: BehaviorProfile,
    table: Table,
    botPlayer: Player
  ): Promise<DecisionResult> {
    try {
      // Verify it's the bot's turn
      if (!botPlayer.turn) {
        throw new Error(`Not bot ${botInstance.bot_instance_id}'s turn`);
      }

      // Build decision context
      const context = this.buildDecisionContext(table, botPlayer);

      // Make decision
      const decision = await BotDecisionEngine.makeDecision(behaviorProfile, context);

      // Log decision (for debugging)
      console.log(`🤖 Bot ${botInstance.display_name} decided: ${decision.decision}`, {
        reasoning: decision.reasoning,
        handStrength: context.botCards.length > 0 ? 'has cards' : 'no cards',
        balance: context.botBalance
      });

      // Emit bot action event
      this.emitBotThinking(table.id.toString(), botInstance, decision.decision);

      return decision;
    } catch (error) {
      console.error(`Error deciding bot action for ${botInstance.bot_instance_id}:`, error);
      // Default to fold on error
      return {
        decision: BotDecision.FOLD,
        reasoning: 'Error occurred during decision making'
      };
    }
  }

  /**
   * Execute a bot decision on the table
   * This modifies the table state directly
   */
  static executeBotDecision(
    table: Table,
    botPlayer: Player,
    botInstance: BotInstance,
    decision: DecisionResult
  ): boolean {
    try {
      switch (decision.decision) {
        case BotDecision.FOLD:
          botPlayer.fold();
          console.log(`🤖 Bot ${botInstance.display_name} folded`);
          break;

        case BotDecision.BET_BLIND:
        case BotDecision.BET_CHAAL:
          const betAmount = decision.betAmount || table.lastBet;
          botPlayer.makeBet(betAmount);
          table.pot += betAmount;
          table.lastBet = betAmount;
          table.lastBlind = decision.decision === BotDecision.BET_BLIND;
          console.log(`🤖 Bot ${botInstance.display_name} bet ${betAmount} (${decision.decision})`);
          break;

        case BotDecision.SEE_CARDS:
          botPlayer.seeCards();
          console.log(`🤖 Bot ${botInstance.display_name} saw cards`);
          // After seeing cards, make another decision
          return false; // Indicate that bot needs to act again
        
        default:
          console.warn(`Unhandled bot decision: ${decision.decision}`);
          return false;
      }

      // Emit bot action event
      this.emitBotAction(table.id.toString(), botInstance, decision);
      
      return true;
    } catch (error) {
      console.error(`Error executing bot decision:`, error);
      return false;
    }
  }

  /**
   * Build decision context from current game state
   */
  private static buildDecisionContext(table: Table, botPlayer: Player): DecisionContext {
    // Convert Map to Array for filtering
    const playersArray = Array.from(table.players.values());
    const activePlayers = playersArray.filter(p => !p.folded && p.connected).length;
    const foldedPlayers = playersArray.filter(p => p.folded).length;

    return {
      // Game state
      currentBet: table.lastBet || table.config.bootAmount,
      pot: table.pot,
      boot: table.config.bootAmount,
      lastBlind: table.lastBlind,

      // Bot state
      botBalance: botPlayer.playerInfo.chips || 0,
      botCards: botPlayer.cardSet?.cards || [],
      hasSeenCards: !botPlayer.cardSet?.closed,
      totalBetSoFar: botPlayer.totalBet || 0,

      // Other players
      activePlayers,
      foldedPlayers,
      totalPlayers: table.players.size,

      // Game progress
      roundNumber: playersArray.reduce((sum, p) => sum + (p.totalBet || 0), 0) / table.config.bootAmount,
      potLimit: table.config.potLimit,
      isPotLimitClose: table.pot >= table.config.potLimit * 0.8,
    };
  }

  /**
   * Emit bot thinking event
   */
  private static emitBotThinking(
    tableId: string,
    botInstance: BotInstance,
    action: BotDecision
  ): void {
    const socketHandler = SocketService.getSocketHandler();
    if (!socketHandler) return;

    // Emit to all players at table
    const io = socketHandler.getIO();
    io.to(`table:${tableId}`).emit('bot:thinking', {
      botId: botInstance.bot_instance_id,
      botName: botInstance.display_name,
      action,
      timestamp: new Date(),
    });
  }

  /**
   * Emit bot action event via socket
   */
  private static emitBotAction(
    tableId: string,
    botInstance: BotInstance,
    decision: DecisionResult
  ): void {
    const socketHandler = SocketService.getSocketHandler();
    if (!socketHandler) return;

    const io = socketHandler.getIO();
    io.to(`table:${tableId}`).emit('bot:action', {
      botId: botInstance.bot_instance_id,
      botName: botInstance.display_name,
      action: decision.decision,
      betAmount: decision.betAmount,
      timestamp: new Date(),
    });
  }

  /**
   * Check if a bot should act (helper for game loop integration)
   */
  static shouldBotAct(player: Player, isBotPlayer: boolean): boolean {
    // Check if player is a bot
    if (!isBotPlayer) return false;

    // Check if it's the bot's turn
    if (!player.turn) return false;

    // Check if bot has already folded
    if (player.folded) return false;

    // Check if bot is connected
    if (!player.connected) return false;

    return true;
  }
}
