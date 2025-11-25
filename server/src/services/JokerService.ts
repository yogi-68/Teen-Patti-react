import { Card } from '../models/Card.js';
import { CardComparer, HandEvaluation } from './CardComparer.js';
import { UserRepository } from '../repositories/UserRepository.js';

/**
 * Joker Service - Handles Joker button feature logic
 * 
 * Features:
 * - Validate Joker eligibility
 * - Track Joker users in game
 * - Calculate Joker group winner
 * - Apply 30% fee to winning Joker user
 * - Manage card visibility for Joker users
 */

export interface JokerUser {
  userId: string;
  username: string;
  cards: Card[];
  handEvaluation: HandEvaluation;
  activatedAt: number;
}

export interface JokerGameState {
  jokerUsers: Map<string, JokerUser>;
  jokerGroupWinner: string | null;
  feeApplied: boolean;
  totalFeeCollected: number;
}

export class JokerService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Validate if user can activate Joker
   * 
   * Requirements:
   * 1. Has made at least one real deposit
   * 2. Has realToken >= 500
   * 3. Table is token (not demo)
   * 4. Has not used Joker in current game
   */
  async canUseJoker(
    userId: string, 
    tableType: 'demo' | 'token',
    hasUsedJokerInCurrentGame: boolean
  ): Promise<{ canUse: boolean; reason?: string }> {
    try {
      // Check table type
      if (tableType === 'demo') {
        return {
          canUse: false,
          reason: 'Joker not available in demo tables'
        };
      }

      // Get user data
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          canUse: false,
          reason: 'User not found'
        };
      }

      // Check if already used Joker this game
      if (hasUsedJokerInCurrentGame) {
        return {
          canUse: false,
          reason: 'Already used Joker in this game'
        };
      }

      // Check deposit requirement
      if (!user.hasMadeFirstDeposit) {
        return {
          canUse: false,
          reason: 'Must make a deposit first'
        };
      }

      // Check minimum balance
      if (user.realToken < 500) {
        return {
          canUse: false,
          reason: `Insufficient balance (need ≥500 coins, have ${user.realToken})`
        };
      }

      return { canUse: true };
    } catch (error) {
      console.error('Error checking Joker eligibility:', error);
      return {
        canUse: false,
        reason: 'Error validating eligibility'
      };
    }
  }

  /**
   * Activate Joker for a user
   */
  activateJoker(
    gameState: JokerGameState,
    userId: string,
    username: string,
    cards: Card[]
  ): void {
    const handEvaluation = CardComparer.evaluateHand(cards);
    
    const jokerUser: JokerUser = {
      userId,
      username,
      cards,
      handEvaluation,
      activatedAt: Date.now()
    };

    gameState.jokerUsers.set(userId, jokerUser);
  }

  /**
   * Get visible cards for a Joker user
   * Joker users can see each other's cards
   */
  getVisibleCardsForJokerUser(
    gameState: JokerGameState,
    requestingUserId: string
  ): Map<string, Card[]> {
    const visibleCards = new Map<string, Card[]>();

    // If requesting user is a Joker user, show all Joker users' cards
    if (gameState.jokerUsers.has(requestingUserId)) {
      for (const [userId, jokerUser] of gameState.jokerUsers.entries()) {
        visibleCards.set(userId, jokerUser.cards);
      }
    }

    return visibleCards;
  }

  /**
   * Calculate the Joker group winner
   * This is the Joker user with the highest hand rank
   */
  calculateJokerGroupWinner(gameState: JokerGameState): string | null {
    if (gameState.jokerUsers.size === 0) {
      return null;
    }

    let highestScore = -1;
    let winnerId: string | null = null;

    for (const [userId, jokerUser] of gameState.jokerUsers.entries()) {
      if (jokerUser.handEvaluation.score > highestScore) {
        highestScore = jokerUser.handEvaluation.score;
        winnerId = userId;
      }
    }

    gameState.jokerGroupWinner = winnerId;
    
    return winnerId;
  }

  /**
   * Apply 30% fee to Joker winner
   * 
   * Fee applies only if:
   * 1. Winner is a Joker user
   * 2. Winner is the Joker group winner (highest hand among Joker users)
   */
  async applyJokerFee(
    gameState: JokerGameState,
    tableWinnerId: string,
    winAmount: number
  ): Promise<{ feeApplied: boolean; feeAmount: number; netWinnings: number }> {
    try {
      // Check if winner is a Joker user
      if (!gameState.jokerUsers.has(tableWinnerId)) {
        return {
          feeApplied: false,
          feeAmount: 0,
          netWinnings: winAmount
        };
      }

      // Check if winner is the Joker group winner
      if (gameState.jokerGroupWinner !== tableWinnerId) {
        // Winner used Joker but didn't have highest Joker hand
        // No fee (they didn't benefit from Joker)
        return {
          feeApplied: false,
          feeAmount: 0,
          netWinnings: winAmount
        };
      }

      // Calculate 30% fee
      const feeAmount = Math.floor(winAmount * 0.30);
      const netWinnings = winAmount - feeAmount;

      // Deduct fee from user's balance
      await this.userRepository.updateRealToken(tableWinnerId, -feeAmount);

      // Update game state
      gameState.feeApplied = true;
      gameState.totalFeeCollected += feeAmount;


      return {
        feeApplied: true,
        feeAmount,
        netWinnings
      };
    } catch (error) {
      console.error('Error applying Joker fee:', error);
      return {
        feeApplied: false,
        feeAmount: 0,
        netWinnings: winAmount
      };
    }
  }

  /**
   * Initialize Joker game state for a new game
   */
  initializeJokerState(): JokerGameState {
    return {
      jokerUsers: new Map(),
      jokerGroupWinner: null,
      feeApplied: false,
      totalFeeCollected: 0
    };
  }

  /**
   * Get Joker status for a specific user
   */
  getJokerStatus(
    gameState: JokerGameState,
    userId: string
  ): {
    hasActivated: boolean;
    isJokerGroupWinner: boolean;
    jokerUserCount: number;
    visibleCards: Map<string, Card[]>;
  } {
    const hasActivated = gameState.jokerUsers.has(userId);
    const isJokerGroupWinner = gameState.jokerGroupWinner === userId;
    const visibleCards = this.getVisibleCardsForJokerUser(gameState, userId);

    return {
      hasActivated,
      isJokerGroupWinner,
      jokerUserCount: gameState.jokerUsers.size,
      visibleCards
    };
  }

  /**
   * Get all Joker users' info (for admin/debugging)
   */
  getJokerUsersInfo(gameState: JokerGameState): JokerUser[] {
    return Array.from(gameState.jokerUsers.values());
  }

  /**
   * Check if user meets minimum requirements for Joker display
   * (Used to show/hide Joker button in UI)
   */
  async meetsJokerRequirements(userId: string): Promise<{
    meetsRequirements: boolean;
    hasMadeDeposit: boolean;
    currentBalance: number;
    needsBalance: number;
  }> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          meetsRequirements: false,
          hasMadeDeposit: false,
          currentBalance: 0,
          needsBalance: 500
        };
      }

      const meetsRequirements = user.hasMadeFirstDeposit && user.realToken >= 500;

      return {
        meetsRequirements,
        hasMadeDeposit: user.hasMadeFirstDeposit,
        currentBalance: user.realToken,
        needsBalance: Math.max(0, 500 - user.realToken)
      };
    } catch (error) {
      console.error('Error checking Joker requirements:', error);
      return {
        meetsRequirements: false,
        hasMadeDeposit: false,
        currentBalance: 0,
        needsBalance: 500
      };
    }
  }

  /**
   * Reset Joker state for a new game
   */
  resetJokerState(gameState: JokerGameState): void {
    gameState.jokerUsers.clear();
    gameState.jokerGroupWinner = null;
    gameState.feeApplied = false;
    // Keep totalFeeCollected for session statistics
  }
}

export default new JokerService();
