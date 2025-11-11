/**
 * Bot Gameplay Integration Service
 * Integrates bots into the game loop by making decisions during their turns
 */

import { BotDecisionEngine, DecisionContext } from './BotDecisionEngine.js';
import BotChatService, { ChatContext } from './BotChatService.js';
import BotInstanceRepository from '../repositories/BotInstanceRepository.js';
import BotBlueprintRepository from '../repositories/BotBlueprintRepository.js';
import { OccupantType } from '../models/TableSeat.js';
import TableSeatRepository from '../repositories/TableSeatRepository.js';
import { Card, CardRank, CardType } from '../models/Card.js';

export interface BotGameAction {
  action: 'call' | 'raise' | 'fold' | 'check' | 'see_cards' | 'show' | 'side_show';
  amount?: number;
  chatMessage?: string;
}

class BotGameplayService {
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
    hand?: string[],
    hasSeenCards: boolean = false // Track if bot has seen their cards
  ): Promise<BotGameAction> {
    const botInstance = await BotInstanceRepository.findById(playerId);
    if (!botInstance) {
      throw new Error(`Bot instance not found: ${playerId}`);
    }

    const blueprint = await BotBlueprintRepository.findById(botInstance.bot_blueprint_id);
    if (!blueprint) {
      throw new Error(`Bot blueprint not found: ${botInstance.bot_blueprint_id}`);
    }

    // Convert hand strings to Card objects
    const cards: Card[] = (hand || []).map(cardStr => {
      const rank = parseInt(cardStr.slice(0, -1)) as CardRank;
      const typeChar = cardStr.slice(-1).toLowerCase();
      const typeMap: Record<string, CardType> = {
        'h': 'heart',
        's': 'spade',
        'd': 'diamond',
        'c': 'club'
      };
      const type = typeMap[typeChar] || 'heart';
      return new Card(type, rank);
    });

    // Prepare decision context
    const decisionContext: DecisionContext = {
      currentBet,
      pot,
      boot: minBet,
      lastBlind: false,
      botBalance: playerBalance,
      botCards: cards,
      hasSeenCards: hasSeenCards, // Use actual state passed from game
      totalBetSoFar: currentBet,
      activePlayers: 2,
      foldedPlayers: 0,
      totalPlayers: 2,
      roundNumber: 1,
      potLimit: 1000,
      isPotLimitClose: false
    };

    // Get decision from engine
    const decision = await BotDecisionEngine.makeDecision(
      blueprint.behavior_profile,
      decisionContext
    );

    // Map decision to action
    let action: BotGameAction['action'] = 'call';
    let amount: number | undefined;

    switch (decision.decision) {
      case 'fold':
        action = 'fold';
        break;
        
      case 'see_cards':
        action = 'see_cards';
        break;
        
      case 'show':
        action = 'show';
        break;
        
      case 'side_show':
        action = 'side_show';
        break;
        
      case 'bet_chaal':
      case 'bet_blind':
        action = decision.betAmount && decision.betAmount > currentBet ? 'raise' : 'call';
        amount = decision.betAmount;
        break;
        
      default:
        // Safe fallback to call
        action = 'call';
        amount = currentBet;
    }

    // Generate optional chat message (20% chance)
    let chatMessage: string | null = null;
    if (Math.random() < 0.2) {
      const chatContext = action === 'fold' ? ChatContext.FOLD : 
                          action === 'raise' ? ChatContext.RAISE : 
                          ChatContext.CONFIDENT;
      
      chatMessage = BotChatService.generateMessage(
        blueprint.behavior_profile,
        chatContext
      );
    }

    // Update bot stats
    await this.updateBotActionStats(botInstance.bot_instance_id, action);

    return {
      action,
      amount,
      chatMessage: chatMessage || undefined
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
   * Generate chat message for bot
   */
  async generateBotChat(
    botId: string,
    context: ChatContext
  ): Promise<string | null> {
    const botInstance = await BotInstanceRepository.findById(botId);
    if (!botInstance) return null;

    const blueprint = await BotBlueprintRepository.findById(botInstance.bot_blueprint_id);
    if (!blueprint) return null;

    return BotChatService.generateMessage(
      blueprint.behavior_profile,
      context
    );
  }
}

export default new BotGameplayService();
