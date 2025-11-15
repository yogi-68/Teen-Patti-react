import type { Table } from '../models/Table.js';
import type { Player } from '../models/Player.js';
import { GameState } from '../models/Table.js';
import { autonomousBotService } from './AutonomousBotService.js';
import { CardComparer, type HandRank } from './CardComparer.js';

/**
 * Controller that makes AI decisions for autonomous bots during gameplay
 */
export class BotAIController {
  private cardComparer = new CardComparer();
  private pendingActions: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Handle bot's turn - make a decision and execute it
   */
  async handleBotTurn(
    player: Player,
    table: Table,
    onAction: (playerId: string, action: any) => void
  ): Promise<void> {
    if (!autonomousBotService.isAutonomousBot(player)) {
      return; // Not a bot
    }

    // Add natural thinking delay
    const delay = autonomousBotService.getThinkingDelay();

    const timeoutId = setTimeout(() => {
      this.executeBotAction(player, table, onAction);
      this.pendingActions.delete(player.id);
    }, delay);

    this.pendingActions.set(player.id, timeoutId);
  }

  /**
   * Execute the bot's decided action
   */
  private executeBotAction(
    player: Player,
    table: Table,
    onAction: (playerId: string, action: any) => void
  ): void {
    try {
      // Check if bot should see cards first
      if (player.cardSet && player.cardSet.closed && table.roundCount > 0) {
        const shouldSee = autonomousBotService.shouldSeeCards(player, table.roundCount);
        if (shouldSee) {
          onAction(player.id, { type: 'seeCards' });
          // After seeing cards, schedule next action
          setTimeout(() => {
            this.decideBettingAction(player, table, onAction);
          }, 500);
          return;
        }
      }

      // Make betting decision
      this.decideBettingAction(player, table, onAction);
    } catch (error) {
      console.error(`❌ Error in bot action for ${player.playerInfo.userName}:`, error);
      // Default to fold on error
      onAction(player.id, { type: 'fold' });
    }
  }

  /**
   * Decide and execute betting action
   */
  private decideBettingAction(
    player: Player,
    table: Table,
    onAction: (playerId: string, action: any) => void
  ): void {
    // Calculate hand strength
    const handStrength = this.calculatePlayerHandStrength(player);

    // Get bot's decision
    const decision = autonomousBotService.decideBettingAction(player, table, handStrength);

    // Execute decision
    switch (decision.action) {
      case 'fold':
        onAction(player.id, { type: 'fold' });
        break;

      case 'call':
        {
          const betAmount = table.lastBet || table.config.bootAmount;
          const isBlind = player.cardSet?.closed || false;
          onAction(player.id, { 
            type: 'bet',
            amount: betAmount,
            isBlind
          });
        }
        break;

      case 'raise':
        {
          const raiseAmount = decision.raiseAmount || table.config.bootAmount * 2;
          const isBlind = player.cardSet?.closed || false;
          onAction(player.id, { 
            type: 'bet',
            amount: raiseAmount,
            isBlind
          });
        }
        break;
    }
  }

  /**
   * Calculate the strength of a player's hand
   */
  private calculatePlayerHandStrength(player: Player): number {
    if (!player.cardSet || !player.cardSet.cards || player.cardSet.cards.length === 0) {
      return 0.1; // No cards = very weak
    }

    // If cards are closed (blind), use lower strength estimate
    if (player.cardSet.closed) {
      return 0.3 + Math.random() * 0.2; // Random 0.3-0.5 for blind
    }

    // Evaluate actual hand (static method)
    const hand = CardComparer.evaluateHand(player.cardSet.cards);
    const highCard = Math.max(...player.cardSet.cards.map(c => c.rank));

    return autonomousBotService.calculateHandStrength(hand.rank, highCard);
  }

  /**
   * Cancel any pending bot action (if player removed/game ended)
   */
  cancelBotAction(playerId: string): void {
    const timeout = this.pendingActions.get(playerId);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingActions.delete(playerId);
    }
  }

  /**
   * Cancel all pending bot actions
   */
  cancelAllBotActions(): void {
    for (const [playerId, timeout] of this.pendingActions.entries()) {
      clearTimeout(timeout);
    }
    this.pendingActions.clear();
  }

  /**
   * Check if it's a bot's turn and handle it automatically
   */
  checkAndHandleBotTurn(
    table: Table,
    onAction: (playerId: string, action: any) => void
  ): boolean {
    if (table.gameState !== GameState.BETTING) {
      return false;
    }

    const currentPlayer = table.getPlayers().find(p => p.turn);
    if (!currentPlayer) {
      return false;
    }

    if (autonomousBotService.isAutonomousBot(currentPlayer)) {
      this.handleBotTurn(currentPlayer, table, onAction);
      return true;
    }

    return false;
  }
}

export const botAIController = new BotAIController();
