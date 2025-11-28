import { Card } from '../models/Card.js';
import { jokerCardGenerator, TierHands } from './JokerCardGenerator.js';
import type { Table } from '../models/Table.js';
import type { Player } from '../models/Player.js';
import { UserRepository } from '../repositories/UserRepository.js';

const userRepository = new UserRepository();

/**
 * NEW Joker Service - Premium tier-based card replacement system
 * 
 * Key Features:
 * - Dynamic tier assignment: newest Joker user gets best tier
 * - Card replacement: players get upgraded hands from tier pool
 * - One use per player per game
 * - 30% deduction from highest winning Joker user
 * - Reveals all cards to all Joker users
 */

export interface JokerGameState {
  jokerUsers: string[]; // Activation order (oldest -> newest)
  jokerTiers: Map<string, number>; // userId -> assigned tier (1-10+)
  jokerTierHands: Map<number, Card[]>; // tier number -> hand (dynamically generated)
  jokerUsedBy: Set<string>; // Track who has used Joker (prevent reuse)
  jokerRevealedCards: Map<string, Card[]>; // All cards revealed to Joker users
  
  // NEW: Dynamic state management
  tableCards: Card[]; // All cards currently on the table
  playerCards: Map<string, Card[]>; // playerId -> current cards
  usedCards: Set<string>; // Card keys that cannot be reused (rank_type)
  jokerQueue: string[]; // Order of joker activations
  jokerHistory: Map<string, Card[]>; // playerId -> assigned joker hand
}

export interface JokerEligibility {
  eligible: boolean;
  reason?: string;
  hasMadeFirstDeposit?: boolean;
  realToken?: number;
}

export interface JokerUsageResult {
  success: boolean;
  userId: string;
  assignedTier: number;
  replacedHand: Card[];
  jokerUsers: string[];
  jokerTiers: Record<string, number>;
  revealedCards: Record<string, Card[]>;
  error?: string;
}

export interface JokerDeduction {
  userId: string;
  netWinnings: number;
  deductionAmount: number;
  deductionPercentage: number;
}

export class JokerService {
  // Store Joker state per table
  private tableJokerState: Map<number, JokerGameState> = new Map();

  /**
   * Initialize Joker state for a table
   * Always resets state for new game
   */
  public initializeTableState(tableId: number): void {
    // Always reset state for new game (not just when it doesn't exist)
    this.tableJokerState.set(tableId, {
      jokerUsers: [],
      jokerTiers: new Map(),
      jokerTierHands: new Map(),
      jokerUsedBy: new Set(),
      jokerRevealedCards: new Map(),
      
      // NEW: Dynamic state
      tableCards: [],
      playerCards: new Map(),
      usedCards: new Set(),
      jokerQueue: [],
      jokerHistory: new Map(),
    });
  }
  
  /**
   * Initialize table cards after game starts and cards are dealt
   * Call this right after dealing cards to all players
   */
  public initializeTableCards(table: Table): void {
    const state = this.tableJokerState.get(table.id);
    if (!state) return;
    
    // Collect all dealt cards
    state.tableCards = [];
    state.playerCards.clear();
    state.usedCards.clear();
    
    table.getPlayers().forEach((player) => {
      if (player.cardSet && player.cardSet.cards) {
        const cards = player.cardSet.cards;
        
        // Store player's cards
        state.playerCards.set(player.id, [...cards]);
        
        // Add to table cards
        state.tableCards.push(...cards);
        
        // Mark as used
        cards.forEach(card => {
          const cardKey = `${card.rank}_${card.type}`;
          state.usedCards.add(cardKey);
        });
        
        console.log(`📋 Stored ${player.playerInfo.userName}'s cards:`, 
          cards.map(c => `${c.rank}${c.type[0].toUpperCase()}`).join('-'));
      }
    });
    
    console.log(`✅ Table ${table.id}: Initialized with ${state.tableCards.length} cards in play`);
  }

  /**
   * Clear Joker state for a table (call at game end)
   */
  public clearTableState(tableId: number): void {
    this.tableJokerState.delete(tableId);
  }

  /**
   * Check if user is eligible to use Joker
   */
  public async checkEligibility(
    userId: string,
    tableId: number,
    gameMode: string
  ): Promise<JokerEligibility> {
    try {
      const state = this.tableJokerState.get(tableId);

      // Check if already used
      if (state && state.jokerUsedBy.has(userId)) {
        return {
          eligible: false,
          reason: 'You have already used Joker in this game',
        };
      }

      // Only available in real/token mode
      if (gameMode !== 'real' && gameMode !== 'token') {
        return {
          eligible: false,
          reason: 'Joker is only available in Token mode',
        };
      }

      // Get user data
      const user = await userRepository.findById(userId);
      if (!user) {
        return {
          eligible: false,
          reason: 'User not found',
        };
      }

      // Check deposit requirement
      if (!user.hasMadeFirstDeposit) {
        return {
          eligible: false,
          reason: 'Premium feature - First deposit required',
          hasMadeFirstDeposit: false,
          realToken: user.realToken,
        };
      }

      // Check balance requirement
      if (user.realToken < 500) {
        return {
          eligible: false,
          reason: 'Minimum ₹500 balance required',
          hasMadeFirstDeposit: true,
          realToken: user.realToken,
        };
      }

      return {
        eligible: true,
        hasMadeFirstDeposit: true,
        realToken: user.realToken,
      };
    } catch (error: any) {
      console.error('❌ Error checking Joker eligibility:', error);
      return {
        eligible: false,
        reason: 'Error validating eligibility',
      };
    }
  }

  /**
   * Generate tier hands for a table (done once per game, on first Joker use)
   * Cards are always dealt at game start, so collect them regardless of "seen" status
   */
  public generateTierHands(table: Table): TierHands {
    const dealtCards = new Map<string, Card[]>();
    
    // Collect all dealt cards (cards exist even if players haven't "seen" them)
    table.getPlayers().forEach((player) => {
      if (player.cardSet && player.cardSet.cards) {
        dealtCards.set(player.id, player.cardSet.cards);
        console.log(`📋 Collecting cards from ${player.playerInfo.userName} for tier generation:`, 
          player.cardSet.cards.map(c => `${c.rank}${c.type[0].toUpperCase()}`).join('-'));
      }
    });

    // Generate tier hands avoiding duplicates
    const tierHands = jokerCardGenerator.generateTierHands(dealtCards);

    // Validate no duplicates
    const isValid = jokerCardGenerator.validateNoDuplicates(tierHands, dealtCards);
    if (!isValid) {
      console.error('⚠️ Tier hands validation failed - duplicates detected');
    }

    console.log('✅ Generated Joker tier hands for table', table.id);

    return tierHands;
  }

  /**
   * Compute best available hand from remaining deck
   * 
   * @param state - Joker game state
   * @param jokerIndex - 1 for first, 2 for second, etc.
   * @returns Best possible 3-card hand from remaining cards
   */
  private computeBestAvailableHand(state: JokerGameState, jokerIndex: number): Card[] | null {
    console.log(`🎯 Computing best hand for Joker #${jokerIndex}`);
    
    // Define tier progression (increasing strength)
    const tierTargets = [
      'pair',           // Joker 1: Best available pair
      'color',          // Joker 2: Best available flush
      'sequence',       // Joker 3: Best available sequence
      'pure_sequence',  // Joker 4: Best available pure sequence
      'trail',          // Joker 5+: Best available trail
    ];
    
    const targetType = tierTargets[Math.min(jokerIndex - 1, tierTargets.length - 1)];
    console.log(`   Target type: ${targetType}`);
    
    // Convert usedCards Set to Map format for card generator
    const usedCardsMap = new Map<string, Card[]>();
    const usedCardsArray: Card[] = [];
    
    state.usedCards.forEach(cardKey => {
      const [rank, type] = cardKey.split('_');
      usedCardsArray.push(new Card(type as any, parseInt(rank) as any));
    });
    
    if (usedCardsArray.length > 0) {
      usedCardsMap.set('used', usedCardsArray);
    }
    
    // Generate best hand from remaining deck
    const bestHand = jokerCardGenerator.generateSingleBestHand(usedCardsMap, targetType);
    
    if (bestHand) {
      console.log(`   ✅ Generated: ${bestHand.map(c => `${c.rank}${c.type[0].toUpperCase()}`).join('-')}`);
    } else {
      console.error(`   ❌ Failed to generate hand`);
    }
    
    return bestHand;
  }
  
  /**
   * Update global state after joker hand assignment
   * 
   * @param state - Joker game state
   * @param userId - Player who activated joker
   * @param oldCards - Player's old cards (to remove from table)
   * @param newCards - Player's new joker hand (to add to table)
   */
  private updateGlobalState(
    state: JokerGameState,
    userId: string,
    oldCards: Card[],
    newCards: Card[]
  ): void {
    // Remove old cards from usedCards
    oldCards.forEach(card => {
      const cardKey = `${card.rank}_${card.type}`;
      state.usedCards.delete(cardKey);
    });
    
    // Add new cards to usedCards
    newCards.forEach(card => {
      const cardKey = `${card.rank}_${card.type}`;
      state.usedCards.add(cardKey);
    });
    
    // Update playerCards
    state.playerCards.set(userId, [...newCards]);
    
    // Update tableCards (remove old, add new)
    state.tableCards = state.tableCards.filter(card => 
      !oldCards.some(old => old.rank === card.rank && old.type === card.type)
    );
    state.tableCards.push(...newCards);
    
    console.log(`   🔄 State updated: removed ${oldCards.length} old cards, added ${newCards.length} new cards`);
  }

  /**
   * Use Joker - NEW PRODUCTION SYSTEM
   * 
   * Algorithm:
   * 1. Verify eligibility
   * 2. Add user to jokerQueue
   * 3. Compute best available hand from remainingDeck (fullDeck - usedCards)
   * 4. Replace player's cards with new hand
   * 5. Update tableCards, usedCards, and jokerHistory
   * 6. Reveal all players' cards to all Joker users
   */
  public async useJoker(
    userId: string,
    table: Table,
    gameMode: string
  ): Promise<JokerUsageResult> {
    try {
      const tableId = table.id;
      const state = this.tableJokerState.get(tableId);
      
      if (!state) {
        this.initializeTableState(tableId);
        this.initializeTableCards(table);
      }
      
      const jokerState = this.tableJokerState.get(tableId)!;

      // Check eligibility
      const eligibility = await this.checkEligibility(userId, tableId, gameMode);
      if (!eligibility.eligible) {
        return {
          success: false,
          userId,
          assignedTier: 0,
          replacedHand: [],
          jokerUsers: [],
          jokerTiers: {},
          revealedCards: {},
          error: eligibility.reason,
        };
      }

      // Add to joker queue
      jokerState.jokerQueue.push(userId);
      jokerState.jokerUsers.push(userId);
      jokerState.jokerUsedBy.add(userId);

      const jokerIndex = jokerState.jokerQueue.length; // 1-based (1st, 2nd, 3rd...)
      
      console.log(`🃏 Joker activation #${jokerIndex} by ${userId}`);
      console.log(`   Current usedCards: ${jokerState.usedCards.size}`);
      
      // Compute best available hand from remaining deck
      const newJokerHand = this.computeBestAvailableHand(jokerState, jokerIndex);
      
      if (!newJokerHand) {
        return {
          success: false,
          userId,
          assignedTier: 0,
          replacedHand: [],
          jokerUsers: [],
          jokerTiers: {},
          revealedCards: {},
          error: 'Unable to generate joker hand from remaining deck',
        };
      }

      // Get player and their old cards
      const player = table.getPlayer(userId);
      if (!player || !player.cardSet) {
        return {
          success: false,
          userId,
          assignedTier: 0,
          replacedHand: [],
          jokerUsers: [],
          jokerTiers: {},
          revealedCards: {},
          error: 'Player not found or no cards',
        };
      }

      const oldCards = player.cardSet.cards;
      const oldCardsStr = oldCards.map(c => `${c.rank}${c.type[0].toUpperCase()}`).join('-');
      
      // PRESERVE displayCards (what other players see) before replacing actual cards
      if (!player.displayCards) {
        player.displayCards = [...oldCards]; // First time - save original cards
      }
      // displayCards stays the same for subsequent joker uses (others always see original cards)
      
      // REPLACE player's actual cards (only visible to the joker user themselves)
      player.cardSet.cards = [...newJokerHand];
      
      // UPDATE global state
      this.updateGlobalState(jokerState, userId, oldCards, newJokerHand);
      
      // Store tier
      const assignedTier = jokerIndex;
      jokerState.jokerTiers.set(userId, assignedTier);
      jokerState.jokerTierHands.set(assignedTier, newJokerHand);
      jokerState.jokerHistory.set(userId, newJokerHand);
      
      const newCardsStr = newJokerHand.map(c => `${c.rank}${c.type[0].toUpperCase()}`).join('-');
      console.log(`   ${player.playerInfo.userName}: ${oldCardsStr} → ${newCardsStr} (Tier ${assignedTier})`);
      console.log(`   ✅ Updated global state - usedCards now: ${jokerState.usedCards.size}`)

      // Collect all cards for reveal (to Joker users only)
      // Cards are ALWAYS dealt when game starts, so reveal them regardless of whether players have "seen" them
      const revealedCards = new Map<string, Card[]>();
      table.getPlayers().forEach((p) => {
        if (p.cardSet && p.cardSet.cards) {
          // Always reveal cards to Joker users, even if other players haven't opened them
          revealedCards.set(p.id, p.cardSet.cards);
          jokerState.jokerRevealedCards.set(p.id, p.cardSet.cards);
          console.log(`🃏 Revealing ${p.playerInfo.userName}'s cards to Joker users:`, 
            p.cardSet.cards.map(c => `${c.rank}${c.type[0].toUpperCase()}`).join('-'));
        } else {
          console.warn(`⚠️ Player ${p.playerInfo.userName} has no cards to reveal!`);
        }
      });

      // Get current user's new hand
      const currentPlayer = table.getPlayer(userId);
      const replacedHand = currentPlayer?.cardSet?.cards || [];
      const finalTier = jokerState.jokerTiers.get(userId) || 0;

      // Convert Maps to plain objects for response
      const jokerTiersObj: Record<string, number> = {};
      jokerState.jokerTiers.forEach((tier, uid) => {
        jokerTiersObj[uid] = tier;
      });

      const revealedCardsObj: Record<string, Card[]> = {};
      revealedCards.forEach((cards, uid) => {
        revealedCardsObj[uid] = cards;
      });

      console.log(`✅ Joker used by ${currentPlayer?.playerInfo.userName} - Tier ${finalTier}`);
      console.log(`📊 Current Joker users: ${jokerState.jokerUsers.length}`);

      return {
        success: true,
        userId,
        assignedTier: finalTier,
        replacedHand,
        jokerUsers: [...jokerState.jokerUsers],
        jokerTiers: jokerTiersObj,
        revealedCards: revealedCardsObj,
      };
    } catch (error: any) {
      console.error('❌ Error in useJoker:', error);
      return {
        success: false,
        userId,
        assignedTier: 0,
        replacedHand: [],
        jokerUsers: [],
        jokerTiers: {},
        revealedCards: {},
        error: error.message || 'Failed to use Joker',
      };
    }
  }

  /**
   * Calculate Joker deduction at game end
   * 
   * Rules:
   * - Find Joker users who won money (net winnings > 0)
   * - Identify the one with highest net winnings
   * - Deduct 30% from that player
   * - Tie-breaker: earliest activation pays (first in jokerUsers array)
   */
  public calculateJokerDeduction(
    tableId: number,
    playerWinnings: Map<string, number>
  ): JokerDeduction | null {
    const state = this.tableJokerState.get(tableId);
    if (!state || state.jokerUsers.length === 0) {
      return null; // No Joker users
    }

    // Find Joker users with positive winnings
    const jokerWinners: Array<{ userId: string; netWin: number }> = [];
    
    state.jokerUsers.forEach((userId) => {
      const netWin = playerWinnings.get(userId) || 0;
      if (netWin > 0) {
        jokerWinners.push({ userId, netWin });
      }
    });

    if (jokerWinners.length === 0) {
      return null; // No Joker users won money
    }

    // Find highest winner
    // Sort by net winnings descending, then by activation order (earliest first as tie-breaker)
    jokerWinners.sort((a, b) => {
      if (b.netWin !== a.netWin) {
        return b.netWin - a.netWin; // Highest win first
      }
      // Tie: earliest activation pays
      const aIndex = state.jokerUsers.indexOf(a.userId);
      const bIndex = state.jokerUsers.indexOf(b.userId);
      return aIndex - bIndex;
    });

    const highestWinner = jokerWinners[0];
    const deductionAmount = Math.floor(highestWinner.netWin * 0.3); // 30% deduction

    console.log(`💰 Joker deduction: ₹${deductionAmount} from user ${highestWinner.userId} (won ₹${highestWinner.netWin})`);

    return {
      userId: highestWinner.userId,
      netWinnings: highestWinner.netWin,
      deductionAmount,
      deductionPercentage: 30,
    };
  }

  /**
   * Apply Joker deduction to user's balance and create transaction
   */
  public async applyJokerDeduction(deduction: JokerDeduction): Promise<boolean> {
    try {
      // Deduct from user's realToken balance
      const user = await userRepository.findById(deduction.userId);
      if (!user) {
        console.error('❌ User not found for Joker deduction:', deduction.userId);
        return false;
      }

      const balanceBefore = user.realToken;
      const balanceAfter = balanceBefore - deduction.deductionAmount;

      // Update balance
      await userRepository.updateRealToken(deduction.userId, -deduction.deductionAmount);

      console.log(`✅ Applied Joker deduction: ₹${deduction.deductionAmount} from ${deduction.userId}`);
      console.log(`   Balance: ₹${balanceBefore} → ₹${balanceAfter}`);

      // Note: Transaction record should be created by the caller with type 'JOKER_DEDUCTION'
      
      return true;
    } catch (error: any) {
      console.error('❌ Error applying Joker deduction:', error);
      return false;
    }
  }

  /**
   * Get Joker status for a table
   */
  public getTableJokerStatus(tableId: number): {
    hasJokerUsers: boolean;
    jokerUsers: string[];
    jokerTiers: Record<string, number>;
    hasTierHands: boolean;
  } {
    const state = this.tableJokerState.get(tableId);
    if (!state) {
      return {
        hasJokerUsers: false,
        jokerUsers: [],
        jokerTiers: {},
        hasTierHands: false,
      };
    }

    const jokerTiersObj: Record<string, number> = {};
    state.jokerTiers.forEach((tier, userId) => {
      jokerTiersObj[userId] = tier;
    });

    return {
      hasJokerUsers: state.jokerUsers.length > 0,
      jokerUsers: [...state.jokerUsers],
      jokerTiers: jokerTiersObj,
      hasTierHands: state.jokerTierHands.size > 0,
    };
  }

  /**
   * Get revealed cards for a specific Joker user
   */
  public getRevealedCards(tableId: number, userId: string): Record<string, Card[]> | null {
    const state = this.tableJokerState.get(tableId);
    if (!state || !state.jokerUsedBy.has(userId)) {
      return null; // User is not a Joker user
    }

    const revealed: Record<string, Card[]> = {};
    state.jokerRevealedCards.forEach((cards, uid) => {
      revealed[uid] = cards;
    });

    return revealed;
  }

  /**
   * Check if user has used Joker in this game
   */
  public hasUsedJoker(tableId: number, userId: string): boolean {
    const state = this.tableJokerState.get(tableId);
    return state ? state.jokerUsedBy.has(userId) : false;
  }

  /**
   * Get user's assigned tier (if they used Joker)
   */
  public getUserTier(tableId: number, userId: string): number | null {
    const state = this.tableJokerState.get(tableId);
    return state ? (state.jokerTiers.get(userId) || null) : null;
  }
}

export const jokerService = new JokerService();
