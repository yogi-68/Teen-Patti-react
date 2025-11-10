/**
 * Bot Gameplay Integration Service
 * Integrates bots into the game loop by making decisions during their turns
 */

import { BotDecisionEngine } from './BotDecisionEngine.js';
import BotChatService from './BotChatService.js';
import BotInstanceRepository from '../repositories/BotInstanceRepository.js';
import BotBlueprintRepository from '../repositories/BotBlueprintRepository.js';
import { OccupantType } from '../models/TableSeat.js';
import TableSeatRepository from '../repositories/TableSeatRepository.js';

export interface BotGameAction {
  action: 'call' | 'raise' | 'fold' | 'check';
  amount?: number;
  chatMessage?: string;
}

class BotGameplayService {
  private decisionEngine: BotDecisionEngine;

  constructor() {
    this.decisionEngine = new BotDecisionEngine();
  }

  /**
   * Check if a player ID belongs to a bot
   */
  async isBot(playerId: string): Promise<boolean> {
    const botInstance = await BotInstanceRepository.findById(playerId);
    return botInstance !== null && botInstance.is_active;
  }

  /**
   * Get bot decision for the current game state
   */
  async getBotDecision(
    playerId: string,
    tableId: number,
    currentBet: number,
    minBet: number,
    playerBalance: number,
    pot: number,
    hand?: string[]
  ): Promise<BotGameAction> {
    const botInstance = await BotInstanceRepository.findById(playerId);
    if (!botInstance) {
      throw new Error(`Bot instance not found: ${playerId}`);
    }

    const blueprint = await BotBlueprintRepository.findById(botInstance.bot_blueprint_id);
    if (!blueprint) {
      throw new Error(`Bot blueprint not found: ${botInstance.bot_blueprint_id}`);
    }

    // Get decision from engine
    const decision = this.decisionEngine.makeDecision({
      hand: hand || [],
      currentBet,
      minBet,
      playerBalance,
      pot,
      opponentCount: 1, // Will be updated by caller with real count
      blindStatus: 'seen', // Default to seen, caller can override
      behaviorProfile: blueprint.behavior_profile
    });

    // Generate optional chat message (20% chance)
    let chatMessage: string | undefined;
    if (Math.random() < 0.2) {
      chatMessage = BotChatService.generateMessage({
        scenario: decision.action === 'fold' ? 'fold' : decision.action === 'raise' ? 'raise' : 'call',
        winProbability: 0.5, // Placeholder
        behaviorProfile: blueprint.behavior_profile,
        recentHistory: []
      });
    }

    // Update bot stats
    await this.updateBotActionStats(botInstance.bot_instance_id, decision.action);

    return {
      action: decision.action,
      amount: decision.amount,
      chatMessage
    };
  }

  /**
   * Handle end of game for bots (update wins/losses)
   */
  async handleGameEnd(playerId: string, won: boolean, winnings: number): Promise<void> {
    const botInstance = await BotInstanceRepository.findById(playerId);
    if (!botInstance) return;

    const updateData: any = {
      games_played: botInstance.games_played + 1,
      last_game_at: new Date()
    };

    if (won) {
      updateData.games_won = botInstance.games_won + 1;
      updateData.total_winnings = botInstance.total_winnings + winnings;
    }

    await BotInstanceRepository.update(playerId, updateData);
  }

  /**
   * Update bot action statistics (internal tracking)
   */
  private async updateBotActionStats(botId: string, action: string): Promise<void> {
    const botInstance = await BotInstanceRepository.findById(botId);
    if (!botInstance) return;

    const updateData: any = {
      last_action_at: new Date()
    };

    if (action === 'fold') {
      updateData.total_hands_folded = (botInstance.total_hands_folded || 0) + 1;
    } else if (action === 'raise' || action === 'call') {
      updateData.total_hands_shown = (botInstance.total_hands_shown || 0) + 1;
    }

    await BotInstanceRepository.update(botId, updateData);
  }

  /**
   * Get all active bots for a table
   */
  async getTableBots(tableId: number): Promise<string[]> {
    const seats = await TableSeatRepository.findAllByTableId(tableId);
    const botSeats = seats.filter(seat => seat.occupant_type === OccupantType.BOT && seat.occupant_id);
    return botSeats.map(seat => seat.occupant_id!);
  }

  /**
   * Check if bot should send a chat message (probability-based)
   */
  shouldSendChat(botId: string, scenario: string): boolean {
    // 20% chance for regular actions, 50% for winning
    return scenario === 'win' ? Math.random() < 0.5 : Math.random() < 0.2;
  }

  /**
   * Generate chat message for bot
   */
  async generateBotChat(
    botId: string,
    scenario: 'fold' | 'call' | 'raise' | 'win' | 'loss',
    context?: any
  ): Promise<string | null> {
    const botInstance = await BotInstanceRepository.findById(botId);
    if (!botInstance) return null;

    const blueprint = await BotBlueprintRepository.findById(botInstance.bot_blueprint_id);
    if (!blueprint) return null;

    if (!this.shouldSendChat(botId, scenario)) {
      return null;
    }

    return BotChatService.generateMessage({
      scenario,
      winProbability: context?.winProbability || 0.5,
      behaviorProfile: blueprint.behavior_profile,
      recentHistory: context?.recentHistory || []
    });
  }
}

export default new BotGameplayService();
