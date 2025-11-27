import type { Table } from '../models/Table.js';
import type { Player } from '../models/Player.js';
import { GameState } from '../models/Table.js';

/**
 * Game Reset Service
 * 
 * Centralizes all reset logic for starting a new game
 * Ensures consistent state cleanup across all game components
 */
export class GameResetService {
  /**
   * Reset all game state for a new game
   * This is the single source of truth for game resets
   */
  public resetGameState(table: Table): void {
    console.log(`🔄 Resetting game state for table ${table.id}`);

    // 1. Reset game state
    table.gameState = GameState.DEALING;
    table.roundCount = 0;

    // 2. Reset deck
    table.deck.reset();
    console.log(`🎴 Deck reset and shuffled`);

    // 3. Reset pot and betting
    table.pot = 0;
    table.lastBet = table.config.bootAmount;
    table.lastBlind = true;
    console.log(`💰 Pot reset to 0, last bet set to boot amount: ${table.config.bootAmount}`);

    // 4. Reset turn
    table.currentTurn = null;

    // 5. Reset Joker state
    this.resetJokerState(table);

    // 6. Reset all players
    this.resetAllPlayers(table);

    console.log(`✅ Game state reset complete for table ${table.id}`);
  }

  /**
   * Reset Joker-related state
   */
  private resetJokerState(table: Table): void {
    table.jokerUsers = [];
    table.jokerTiers.clear();
    table.jokerUsedBy.clear();
    console.log(`🃏 Joker state cleared (users, tiers, usage tracking)`);
  }

  /**
   * Reset all players for new game
   */
  private resetAllPlayers(table: Table): void {
    let playerCount = 0;

    table.players.forEach((player: Player) => {
      // Reset betting state
      player.bet = 0;
      player.totalBet = 0;

      // Reset action state
      player.folded = false;
      player.turn = false;

      // Reset cards
      player.cardSet = null;

      // Activate players waiting for next round
      player.waitingForNextRound = false;

      playerCount++;
    });

    console.log(`👥 Reset ${playerCount} players (cards, bets, actions, waiting status)`);
  }

  /**
   * Collect boot amount from all active players
   * Call this after resetGameState
   */
  public collectBootAmount(table: Table): { success: boolean; message?: string } {
    const bootAmount = table.config.bootAmount;
    let collectedCount = 0;
    let failedPlayers: string[] = [];

    table.players.forEach((player: Player) => {
      if (!player.waitingForNextRound) {
        try {
          player.makeBet(bootAmount);
          table.pot += bootAmount;
          collectedCount++;
        } catch (error) {
          // Player doesn't have enough chips
          failedPlayers.push(player.playerInfo.userName);
          player.waitingForNextRound = true; // Exclude from this game
        }
      }
    });

    if (failedPlayers.length > 0) {
      console.warn(`⚠️ Could not collect boot from: ${failedPlayers.join(', ')}`);
    }

    console.log(`💵 Collected boot (${bootAmount}) from ${collectedCount} players. Pot: ${table.pot}`);

    return {
      success: true,
      message: failedPlayers.length > 0 
        ? `Some players couldn't pay boot: ${failedPlayers.join(', ')}`
        : undefined
    };
  }

  /**
   * Validate table is ready to start new game
   */
  public validateGameStart(table: Table): { valid: boolean; reason?: string } {
    const activePlayers = Array.from(table.players.values()).filter(
      p => !p.waitingForNextRound
    );

    if (activePlayers.length < 2) {
      return {
        valid: false,
        reason: 'Need at least 2 players to start'
      };
    }

    return { valid: true };
  }

  /**
   * Complete reset - combines all reset operations in correct order
   */
  public performCompleteReset(table: Table): { success: boolean; message?: string } {
    try {
      // Step 1: Validate
      const validation = this.validateGameStart(table);
      if (!validation.valid) {
        return { success: false, message: validation.reason };
      }

      // Step 2: Reset all game state
      this.resetGameState(table);

      // Step 3: Collect boot amount
      const bootResult = this.collectBootAmount(table);

      // Step 4: Final validation after boot collection
      const finalValidation = this.validateGameStart(table);
      if (!finalValidation.valid) {
        return { success: false, message: finalValidation.reason };
      }

      return {
        success: true,
        message: bootResult.message
      };
    } catch (error) {
      console.error(`❌ Error during game reset for table ${table.id}:`, error);
      return {
        success: false,
        message: `Reset failed: ${(error as Error).message}`
      };
    }
  }
}

// Export singleton instance
export const gameResetService = new GameResetService();
