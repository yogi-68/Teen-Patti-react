import { Card } from '../models/Card.js';
import { BehaviorProfile } from '../models/BotBlueprint.js';
import { CardComparer, HandRank } from './CardComparer.js';

/**
 * Bot Decision Types
 */
export enum BotDecision {
  FOLD = 'fold',
  BET_BLIND = 'bet_blind',
  BET_CHAAL = 'bet_chaal',
  SEE_CARDS = 'see_cards',
  SIDE_SHOW = 'side_show',
  SHOW = 'show',
}

/**
 * Decision Context - Information needed to make a decision
 */
export interface DecisionContext {
  // Game State
  currentBet: number;
  pot: number;
  boot: number;
  lastBlind: boolean; // Was last bet blind or chaal
  
  // Bot State
  botBalance: number;
  botCards: Card[];
  hasSeenCards: boolean;
  totalBetSoFar: number;
  
  // Other Players
  activePlayers: number;
  foldedPlayers: number;
  totalPlayers: number;
  
  // Game Progress
  roundNumber: number; // How many betting rounds have occurred
  potLimit: number;
  isPotLimitClose: boolean; // Is pot approaching limit
  
  // Betting Pattern Analysis (PUBLIC INFO ONLY - no card peeking!)
  averageBetSize?: number; // Average bet in this game
  lastRaiseAmount?: number; // How much last player raised
  opponentSeemAggressive?: boolean; // Based on betting patterns, not cards
}

/**
 * Decision Result
 */
export interface DecisionResult {
  decision: BotDecision;
  betAmount?: number;
  reasoning?: string; // For debugging/logging
}

/**
 * Bot Decision Engine
 * Makes intelligent gameplay decisions based on bot behavior profile
 */
export class BotDecisionEngine {
  /**
   * Make a decision for a bot
   */
  static async makeDecision(
    behaviorProfile: BehaviorProfile,
    context: DecisionContext
  ): Promise<DecisionResult> {
    // Add random delay to simulate human thinking
    await this.addReactionDelay(behaviorProfile.reaction_delay_ms);

    // Evaluate hand strength
    const handStrength = this.evaluateHandStrength(context.botCards);

    // Check if bot should make an error (for realism)
    if (this.shouldMakeError(behaviorProfile.error_rate)) {
      return this.makeErrorDecision(context);
    }

    // If bot hasn't seen cards yet, decide whether to see or play blind
    if (!context.hasSeenCards) {
      return this.decideBlindStrategy(behaviorProfile, context, handStrength);
    }

    // Bot has seen cards - make informed decision
    return this.makeInformedDecision(behaviorProfile, context, handStrength);
  }

  /**
   * Evaluate hand strength (0-1 scale)
   */
  private static evaluateHandStrength(cards: Card[]): number {
    if (cards.length !== 3) return 0;

    try {
      const evaluation = CardComparer.evaluateHand(cards);
      
      // Normalize hand strength to 0-1 scale
      // Trail = 6 (best), High Card = 1 (worst)
      const rankStrength = evaluation.rank / 6;

      // Add fine-tuning based on card values
      const cardBonus = evaluation.cards.reduce((sum, card) => sum + card.priority, 0) / (14 * 3);

      return Math.min(1, rankStrength * 0.8 + cardBonus * 0.2);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Decide strategy when playing blind - Human-like random card seeing
   */
  private static decideBlindStrategy(
    profile: BehaviorProfile,
    context: DecisionContext,
    handStrength: number
  ): DecisionResult {
    // HUMAN-LIKE: Random decision to see cards based on various factors
    
    // Calculate probability to see cards (increases with rounds)
    let seeCardsProbability = 0;
    
    // Base probability increases each round
    if (context.roundNumber === 1) seeCardsProbability = 0.25; // 25% on first round
    else if (context.roundNumber === 2) seeCardsProbability = 0.40; // 40% on second
    else if (context.roundNumber === 3) seeCardsProbability = 0.55; // 55% on third
    else if (context.roundNumber >= 4) seeCardsProbability = 0.70; // 70% after 4th
    
    // Adjust based on aggressiveness
    if (profile.aggressiveness > 70) {
      seeCardsProbability += 0.15; // Aggressive players see cards sooner
    } else if (profile.aggressiveness < 40) {
      seeCardsProbability += 0.20; // Conservative players see cards even sooner
    }
    
    // High pot = more likely to see cards
    if (context.pot > context.currentBet * 8) {
      seeCardsProbability += 0.15;
    }
    
    // High current bet = more likely to see cards
    const currentBetRatio = context.currentBet / context.botBalance;
    if (currentBetRatio > 0.15) {
      seeCardsProbability += 0.20;
    }
    
    // Random decision based on probability
    if (Math.random() < seeCardsProbability) {
      return {
        decision: BotDecision.SEE_CARDS,
        reasoning: `Deciding to see cards at round ${context.roundNumber}`
      };
    }

    // Otherwise, play blind - NEVER FOLD, always bet
    const blindBet = this.calculateBlindBet(profile, context);
    
    // Cap at balance if needed
    const finalBlindBet = Math.min(blindBet, context.botBalance);

    return {
      decision: BotDecision.BET_BLIND,
      betAmount: finalBlindBet,
      reasoning: `Blind betting round ${context.roundNumber}`
    };
  }

  /**
   * Make informed decision after seeing cards - NEVER FOLD, always bet
   */
  private static makeInformedDecision(
    profile: BehaviorProfile,
    context: DecisionContext,
    handStrength: number
  ): DecisionResult {
    // Calculate minimum bet needed
    const minBet = context.lastBlind ? context.currentBet * 2 : context.currentBet;

    // Decision based on hand strength and risk tolerance
    const threshold = this.getActionThreshold(profile, context);

    // SHOW if hand is very strong and conditions are right
    if (this.shouldShow(profile, context, handStrength)) {
      return {
        decision: BotDecision.SHOW,
        reasoning: `Strong hand (${handStrength.toFixed(2)}) - calling show`
      };
    }

    // SIDE SHOW if applicable
    if (this.shouldSideShow(profile, context, handStrength)) {
      return {
        decision: BotDecision.SIDE_SHOW,
        reasoning: 'Attempting side show with previous player'
      };
    }

    // BET/CALL - calculate bet amount (NEVER FOLD)
    const betAmount = this.calculateChaalBet(profile, context, handStrength, minBet);
    
    // Cap at balance
    const finalBet = Math.min(betAmount, context.botBalance);

    return {
      decision: BotDecision.BET_CHAAL,
      betAmount: finalBet,
      reasoning: `Betting with hand strength ${handStrength.toFixed(2)}`
    };
  }

  /**
   * Calculate blind bet amount - Use +/- button logic (double/half)
   */
  private static calculateBlindBet(
    profile: BehaviorProfile,
    context: DecisionContext
  ): number {
    const minBet = context.lastBlind ? context.currentBet : context.currentBet / 2;
    
    // Start with minimum bet
    let betAmount = minBet;
    
    // Decide how many times to press "+" (double button)
    // Based on aggressiveness and randomness
    let pressCount = 0;
    
    // Aggressive bots press + more times (0-3 times)
    if (profile.aggressiveness > 70) {
      pressCount = Math.floor(Math.random() * 4); // 0-3 presses
    } else if (profile.aggressiveness > 40) {
      pressCount = Math.floor(Math.random() * 3); // 0-2 presses
    } else {
      pressCount = Math.floor(Math.random() * 2); // 0-1 press
    }
    
    // Double the bet for each press
    for (let i = 0; i < pressCount; i++) {
      betAmount = betAmount * 2;
      // Stop if we exceed balance
      if (betAmount > context.botBalance) {
        betAmount = betAmount / 2; // Go back one step
        break;
      }
    }
    
    // Ensure we stay within limits
    betAmount = Math.max(minBet, Math.min(betAmount, context.botBalance));
    
    return betAmount;
  }

  /**
   * Calculate chaal (seen) bet amount - Use +/- button logic (double/half)
   */
  private static calculateChaalBet(
    profile: BehaviorProfile,
    context: DecisionContext,
    handStrength: number,
    minBet: number
  ): number {
    // Start with minimum bet
    let betAmount = minBet;
    
    // Decide how many times to press "+" based on hand strength and aggressiveness
    let pressCount = 0;
    
    // WEAK HAND (0-0.3): Maybe bet minimum or 1x double
    if (handStrength < 0.3) {
      // 30% chance to just call minimum, 50% chance 1 press, 20% chance 2 presses (bluff)
      const random = Math.random();
      if (random < 0.30) {
        pressCount = 0; // Just call
      } else if (random < 0.80) {
        pressCount = 1; // One double
      } else if (profile.aggressiveness > 60) {
        pressCount = 2; // Bluff with 2 doubles
      }
    }
    // MEDIUM HAND (0.3-0.7): Press + 1-2 times
    else if (handStrength < 0.7) {
      pressCount = 1 + Math.floor(Math.random() * 2); // 1-2 presses
      
      // Aggressive bots press more
      if (profile.aggressiveness > 70 && Math.random() < 0.3) {
        pressCount += 1;
      }
    }
    // STRONG HAND (0.7-1.0): Press + 2-4 times
    else {
      pressCount = 2 + Math.floor(Math.random() * 3); // 2-4 presses
      
      // Very aggressive with strong hands
      if (profile.aggressiveness > 75 && Math.random() < 0.2) {
        pressCount += 1; // Extra press
      }
    }
    
    // Apply the presses (double each time)
    for (let i = 0; i < pressCount; i++) {
      const newBet = betAmount * 2;
      // Stop if we exceed 70% of balance
      if (newBet > context.botBalance * 0.7) {
        break;
      }
      betAmount = newBet;
    }
    
    // Ensure we stay within limits
    betAmount = Math.max(minBet, Math.min(betAmount, context.botBalance * 0.7));
    
    return betAmount;
  }

  /**
   * Get action thresholds based on profile - Human-like intelligence
   */
  private static getActionThreshold(
    profile: BehaviorProfile,
    context: DecisionContext
  ): { foldThreshold: number; showThreshold: number; sideShowThreshold: number } {
    // HUMAN-LIKE: Fold threshold based on skill and hand strength
    // Lower aggressiveness = fold more easily
    const foldBase = 0.35 - (profile.aggressiveness / 100 * 0.20); // 0.15 to 0.35
    
    // Consider pot odds - humans adjust based on value
    const potOdds = context.pot / (context.currentBet || 1);
    let foldAdjustment = 0;
    if (potOdds > 10) {
      foldAdjustment = -0.1; // Worth staying with large pot
    } else if (potOdds < 3) {
      foldAdjustment = 0.05; // Fold more easily with small pot
    }
    
    // Adjust based on how much is at stake
    const stakeRatio = context.currentBet / context.botBalance;
    if (stakeRatio > 0.3) {
      foldAdjustment += 0.1; // More cautious when risking significant portion
    }
    
    return {
      foldThreshold: Math.max(0.15, Math.min(0.40, foldBase + foldAdjustment)), // 0.15 to 0.40 range
      showThreshold: 0.60 + ((1 - profile.aggressiveness / 100) * 0.25), // 0.60 to 0.85
      sideShowThreshold: 0.50 + ((profile.aggressiveness / 100 - 0.5) * 0.2), // Balanced side show
    };
  }

  /**
   * Decide if bot should show cards
   */
  private static shouldShow(
    profile: BehaviorProfile,
    context: DecisionContext,
    handStrength: number
  ): boolean {
    const threshold = this.getActionThreshold(profile, context);
    
    // Only show with very strong hands
    if (handStrength < threshold.showThreshold) return false;
    
    // Don't show if only 2 players left and can do side show
    if (context.activePlayers === 2 && context.roundNumber < 15) return false;
    
    // Show if pot is high and hand is strong
    if (context.pot > context.boot * 20 && handStrength > 0.8) return true;
    
    // Show if approaching pot limit
    if (context.isPotLimitClose && handStrength > 0.75) return true;
    
    // Show if many rounds have passed
    if (context.roundNumber > 20 && handStrength > threshold.showThreshold) return true;
    
    return false;
  }

  /**
   * Decide if bot should attempt side show
   */
  private static shouldSideShow(
    profile: BehaviorProfile,
    context: DecisionContext,
    handStrength: number
  ): boolean {
    // Only if 2+ players active
    if (context.activePlayers < 2) return false;
    
    // Only after seeing cards
    if (!context.hasSeenCards) return false;
    
    // Only if hand is decent
    const threshold = this.getActionThreshold(profile, context);
    if (handStrength < threshold.sideShowThreshold) return false;
    
    // More likely with aggressive profile
    if (profile.aggressiveness > 0.6 && handStrength > 0.6) return true;
    
    // Conservative bots rarely side show
    if (profile.aggressiveness < 0.4) return false;
    
    // Random chance for balanced bots
    return Math.random() < 0.3;
  }

  /**
   * Make an intentional error for realism
   */
  private static makeErrorDecision(context: DecisionContext): DecisionResult {
    const errors: BotDecision[] = [
      BotDecision.FOLD,
      BotDecision.BET_BLIND,
      BotDecision.BET_CHAAL,
    ];
    
    const randomError = errors[Math.floor(Math.random() * errors.length)];
    
    if (randomError === BotDecision.FOLD) {
      return {
        decision: BotDecision.FOLD,
        reasoning: 'Error: Random fold'
      };
    }
    
    // Random bet amount (could be too high or too low)
    const randomBet = Math.ceil(context.currentBet * (0.5 + Math.random() * 2));
    
    return {
      decision: randomError,
      betAmount: Math.min(randomBet, context.botBalance),
      reasoning: 'Error: Random action'
    };
  }

  /**
   * Check if bot should make an error
   */
  private static shouldMakeError(errorRate: number): boolean {
    return Math.random() < errorRate;
  }

  /**
   * Add reaction delay to simulate human thinking
   */
  private static async addReactionDelay(baseDelayMs: number): Promise<void> {
    // Add some randomness (±30%)
    const randomFactor = 0.7 + Math.random() * 0.6;
    const delay = Math.floor(baseDelayMs * randomFactor);
    
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}
