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
   * Decide strategy when playing blind
   */
  private static decideBlindStrategy(
    profile: BehaviorProfile,
    context: DecisionContext,
    handStrength: number
  ): DecisionResult {
    // Aggressive bots see cards early
    if (profile.aggressiveness > 0.7 && context.roundNumber >= 2) {
      return {
        decision: BotDecision.SEE_CARDS,
        reasoning: 'Aggressive bot sees cards after 2 rounds'
      };
    }

    // Conservative bots see cards quickly
    if (profile.aggressiveness < 0.3 && context.roundNumber >= 1) {
      return {
        decision: BotDecision.SEE_CARDS,
        reasoning: 'Conservative bot sees cards early'
      };
    }

    // Balanced bots see cards after a few rounds
    if (profile.aggressiveness >= 0.4 && profile.aggressiveness <= 0.6 && context.roundNumber >= 3) {
      return {
        decision: BotDecision.SEE_CARDS,
        reasoning: 'Balanced bot sees cards after 3 rounds'
      };
    }

    // Otherwise, play blind
    const blindBet = this.calculateBlindBet(profile, context);
    
    // Check if bot should fold (low balance, high bet)
    if (blindBet > context.botBalance * 0.3 && context.roundNumber > 5) {
      return {
        decision: BotDecision.FOLD,
        reasoning: 'Blind bot folding - bet too high for balance'
      };
    }

    return {
      decision: BotDecision.BET_BLIND,
      betAmount: blindBet,
      reasoning: `Blind betting round ${context.roundNumber}`
    };
  }

  /**
   * Make informed decision after seeing cards
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

    // FOLD if hand is weak and bet is significant
    if (handStrength < threshold.foldThreshold) {
      if (minBet > context.botBalance * 0.2 || context.roundNumber > 10) {
        return {
          decision: BotDecision.FOLD,
          reasoning: `Weak hand (${handStrength.toFixed(2)}) and high bet`
        };
      }
    }

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

    // BET/CALL - calculate bet amount
    const betAmount = this.calculateChaalBet(profile, context, handStrength, minBet);
    
    // Final safety check - fold if bet is too much
    if (betAmount > context.botBalance) {
      return {
        decision: BotDecision.FOLD,
        reasoning: 'Insufficient balance for calculated bet'
      };
    }

    return {
      decision: BotDecision.BET_CHAAL,
      betAmount,
      reasoning: `Betting with hand strength ${handStrength.toFixed(2)}`
    };
  }

  /**
   * Calculate blind bet amount
   */
  private static calculateBlindBet(
    profile: BehaviorProfile,
    context: DecisionContext
  ): number {
    const minBet = context.lastBlind ? context.currentBet : context.currentBet / 2;
    
    // Aggressive bots bet more
    const aggressivenessMultiplier = 1 + (profile.aggressiveness * 0.5);
    
    // Adjust for round number (bet more as game progresses)
    const roundMultiplier = 1 + (context.roundNumber * 0.1);
    
    let betAmount = Math.ceil(minBet * aggressivenessMultiplier * roundMultiplier);
    
    // Cap at balance
    betAmount = Math.min(betAmount, context.botBalance);
    
    // Ensure minimum bet
    return Math.max(betAmount, minBet);
  }

  /**
   * Calculate chaal (seen) bet amount
   */
  private static calculateChaalBet(
    profile: BehaviorProfile,
    context: DecisionContext,
    handStrength: number,
    minBet: number
  ): number {
    // Base bet on hand strength
    const strengthMultiplier = 0.8 + (handStrength * 0.4); // 0.8 to 1.2
    
    // Aggressive bots bet more with strong hands
    const aggressivenessMultiplier = 1 + (profile.aggressiveness * handStrength * 0.5);
    
    // Risk tolerance affects bet size
    const riskMultiplier = 1 + ((profile.risk_tolerance - 50) / 100);
    
    // ANALYZE BETTING PATTERNS - Adjust based on opponent aggression
    let opponentAdjustment = 1.0;
    if (context.opponentSeemAggressive) {
      // If opponents are aggressive, be more cautious with weak hands
      if (handStrength < 0.5) {
        opponentAdjustment = 0.8; // Bet less against aggressive players
      } else {
        opponentAdjustment = 1.2; // Bet more with strong hands to counter
      }
    }
    
    // ANALYZE POT ODDS - Is the pot worth the risk?
    const potOdds = context.pot / (context.currentBet || 1);
    let potOddsAdjustment = 1.0;
    if (potOdds > 15 && handStrength > 0.6) {
      potOddsAdjustment = 1.3; // Large pot with good hand = bet more
    } else if (potOdds < 5 && handStrength < 0.4) {
      potOddsAdjustment = 0.7; // Small pot with weak hand = bet less
    }
    
    let betAmount = Math.ceil(
      minBet * strengthMultiplier * aggressivenessMultiplier * riskMultiplier * opponentAdjustment * potOddsAdjustment
    );
    
    // Don't bet more than a portion of balance
    const maxBetRatio = profile.risk_tolerance / 100; // 0.3 to 1.0
    betAmount = Math.min(betAmount, context.botBalance * maxBetRatio);
    
    // Ensure minimum bet
    return Math.max(betAmount, minBet);
  }

  /**
   * Get action thresholds based on profile
   */
  private static getActionThreshold(
    profile: BehaviorProfile,
    context: DecisionContext
  ): { foldThreshold: number; showThreshold: number; sideShowThreshold: number } {
    // Conservative bots fold easier
    const foldBase = 0.2 + (profile.aggressiveness * 0.2); // 0.2 to 0.4
    
    // Adjust for pot odds
    const potOdds = context.pot / (context.currentBet || 1);
    const foldAdjustment = potOdds > 10 ? -0.1 : 0;
    
    return {
      foldThreshold: Math.max(0.1, foldBase + foldAdjustment),
      showThreshold: 0.7 + ((1 - profile.aggressiveness) * 0.2), // 0.7 to 0.9
      sideShowThreshold: 0.5 + ((profile.aggressiveness - 0.5) * 0.3), // 0.35 to 0.65
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
