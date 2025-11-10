import { BehaviorProfile } from '../models/BotBlueprint.js';

/**
 * BotBehaviorEngine - Implements human-like bot behavior
 * Handles timing, skill levels, error rates, and decision adjustments
 */

/**
 * Add human-like delay with jitter
 * @param baseDelayMs - Base delay from behavior profile
 * @param jitterPercent - Percentage of jitter to add (default 30%)
 */
export async function addHumanLikeDelay(
  baseDelayMs: number,
  jitterPercent: number = 30
): Promise<void> {
  const jitter = baseDelayMs * (jitterPercent / 100);
  const minDelay = Math.max(baseDelayMs - jitter, 100); // Minimum 100ms
  const maxDelay = baseDelayMs + jitter;
  
  const actualDelay = minDelay + Math.random() * (maxDelay - minDelay);
  
  return new Promise(resolve => setTimeout(resolve, actualDelay));
}

/**
 * Add occasional "thinking" pause (longer delay)
 * @param profile - Bot behavior profile
 * @param thinkingProbability - Probability of thinking pause (0-1)
 */
export async function maybeAddThinkingPause(
  profile: BehaviorProfile,
  thinkingProbability: number = 0.15
): Promise<void> {
  if (Math.random() < thinkingProbability) {
    // 2-5x longer delay for "thinking"
    const thinkingMultiplier = 2 + Math.random() * 3;
    const thinkingDelay = profile.reaction_delay_ms * thinkingMultiplier;
    await addHumanLikeDelay(thinkingDelay, 40);
  } else {
    // Normal delay
    await addHumanLikeDelay(profile.reaction_delay_ms);
  }
}

/**
 * Calculate hand evaluation depth based on skill level
 * @param skillLevel - 0-100 skill level
 * @returns Evaluation depth (1-5)
 */
export function getHandEvaluationDepth(skillLevel: number): number {
  if (skillLevel >= 90) return 5; // Near-optimal analysis
  if (skillLevel >= 70) return 4; // Advanced
  if (skillLevel >= 50) return 3; // Intermediate
  if (skillLevel >= 30) return 2; // Basic
  return 1; // Minimal/random
}

/**
 * Determine if bot should make an error based on error_rate
 * @param errorRate - Error rate percentage (0-20)
 * @returns true if bot should make mistake
 */
export function shouldMakeMistake(errorRate: number): boolean {
  return Math.random() * 100 < errorRate;
}

/**
 * Apply error to decision
 * Converts optimal decision to suboptimal one
 */
export function applyDecisionError(
  optimalDecision: string,
  availableActions: string[]
): string {
  // Random action from available (except optimal)
  const suboptimalActions = availableActions.filter(a => a !== optimalDecision);
  
  if (suboptimalActions.length === 0) {
    return optimalDecision; // No alternative
  }

  return suboptimalActions[Math.floor(Math.random() * suboptimalActions.length)];
}

/**
 * Adjust bet amount based on aggressiveness
 * @param baseBet - Calculated base bet amount
 * @param profile - Bot behavior profile
 * @returns Adjusted bet amount
 */
export function adjustBetAmount(
  baseBet: number,
  profile: BehaviorProfile
): number {
  const aggressiveFactor = profile.aggressiveness / 100;
  
  // Aggressive bots bet 20-40% more
  // Conservative bots bet 20-40% less
  const multiplier = 0.8 + (aggressiveFactor * 0.8);
  
  return Math.floor(baseBet * multiplier);
}

/**
 * Decide if bot should play marginal hand based on risk tolerance
 * @param handStrength - 0-1 hand strength score
 * @param profile - Bot behavior profile
 * @returns true if should play
 */
export function shouldPlayMarginalHand(
  handStrength: number,
  profile: BehaviorProfile
): boolean {
  // Threshold based on risk tolerance
  const threshold = 0.3 + (profile.risk_tolerance / 100) * 0.4;
  
  // Add some randomness
  const adjustedThreshold = threshold + (Math.random() - 0.5) * 0.1;
  
  return handStrength >= adjustedThreshold;
}

/**
 * Calculate pot odds threshold based on skill level
 * @param skillLevel - 0-100 skill level
 * @returns Minimum pot odds to call (lower = better understanding)
 */
export function getPotOddsThreshold(skillLevel: number): number {
  // Skilled bots understand pot odds better
  if (skillLevel >= 80) return 2.0; // 2:1 or better
  if (skillLevel >= 60) return 2.5; // 2.5:1 or better
  if (skillLevel >= 40) return 3.0; // 3:1 or better
  if (skillLevel >= 20) return 4.0; // 4:1 or better
  return 5.0; // Poor understanding of odds
}

/**
 * Simulate thinking time variation
 * Complex situations = longer delays
 */
export async function addContextualDelay(
  profile: BehaviorProfile,
  context: {
    potSize: number;
    handStrength: number;
    opponentsRemaining: number;
  }
): Promise<void> {
  let delayMultiplier = 1.0;

  // Larger pot = more thinking
  if (context.potSize > 1000) delayMultiplier *= 1.3;
  if (context.potSize > 5000) delayMultiplier *= 1.5;

  // Marginal hands = more thinking
  if (context.handStrength > 0.3 && context.handStrength < 0.7) {
    delayMultiplier *= 1.4;
  }

  // More opponents = more complex
  if (context.opponentsRemaining >= 3) delayMultiplier *= 1.2;

  const adjustedDelay = profile.reaction_delay_ms * delayMultiplier;
  await addHumanLikeDelay(adjustedDelay);
}

/**
 * Check if action should be fast (auto-fold weak hands, auto-call strong hands)
 * @param handStrength - 0-1 hand strength
 * @param profile - Behavior profile
 * @param action - Proposed action
 * @returns true if should be fast
 */
export function shouldUseFastAction(
  handStrength: number,
  profile: BehaviorProfile,
  action: string
): boolean {
  // High skill bots recognize obvious situations
  if (profile.skill_level < 50) return false;

  // Auto-fold terrible hands (unless error occurs)
  if (handStrength < 0.15 && action === 'fold' && !shouldMakeMistake(profile.error_rate)) {
    return true;
  }

  // Auto-call/bet premium hands
  if (handStrength > 0.90 && (action === 'call' || action === 'bet') && !shouldMakeMistake(profile.error_rate)) {
    return true;
  }

  return false;
}

/**
 * Get fast action delay (200-500ms)
 */
export async function addFastActionDelay(): Promise<void> {
  const delay = 200 + Math.random() * 300;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Determine if bot should show emotion/reaction
 * @param result - 'win' | 'loss' | 'fold'
 * @param magnitude - How significant (0-1)
 * @returns Probability of showing reaction
 */
export function getEmotionProbability(
  result: 'win' | 'loss' | 'fold',
  magnitude: number
): number {
  if (result === 'win' && magnitude > 0.7) return 0.6; // Big wins
  if (result === 'loss' && magnitude > 0.7) return 0.4; // Bad beats
  if (result === 'fold') return 0.1; // Rarely react to folds
  return 0.2; // Normal play
}

/**
 * Calculate bluff frequency based on profile
 * @param profile - Behavior profile
 * @returns Bluff probability (0-1)
 */
export function getBluffProbability(profile: BehaviorProfile): number {
  // Aggressive bots bluff more, skilled bots bluff better situations
  const baseBluff = profile.aggressiveness / 100 * 0.3;
  const skillAdjustment = profile.skill_level / 100 * 0.1;
  
  return Math.min(baseBluff + skillAdjustment, 0.5); // Max 50% bluff rate
}

/**
 * Determine if current situation is good for bluff
 * @param context - Game context
 * @returns true if good bluff spot
 */
export function isGoodBluffSpot(context: {
  opponentsRemaining: number;
  potSize: number;
  boardTexture: 'scary' | 'normal' | 'dry';
  position: 'early' | 'middle' | 'late';
}): boolean {
  let bluffScore = 0;

  // Fewer opponents = better bluff
  if (context.opponentsRemaining === 1) bluffScore += 3;
  else if (context.opponentsRemaining === 2) bluffScore += 1;

  // Scary board = better bluff
  if (context.boardTexture === 'scary') bluffScore += 2;

  // Late position = better bluff
  if (context.position === 'late') bluffScore += 2;
  else if (context.position === 'middle') bluffScore += 1;

  // Big pot = avoid bluff (too risky)
  if (context.potSize > 5000) bluffScore -= 2;

  return bluffScore >= 4;
}

/**
 * Adjust decision based on table position
 * @param baseDecision - Initial decision
 * @param position - Table position
 * @param profile - Behavior profile
 * @returns Adjusted decision
 */
export function adjustForPosition(
  baseDecision: string,
  position: 'early' | 'middle' | 'late',
  profile: BehaviorProfile
): string {
  // Only skilled bots understand position
  if (profile.skill_level < 40) return baseDecision;

  // Early position = tighter play
  if (position === 'early' && baseDecision === 'bet') {
    if (Math.random() < 0.3) return 'call'; // Sometimes just call
  }

  // Late position = more aggressive
  if (position === 'late' && baseDecision === 'call') {
    if (Math.random() < 0.4 && profile.aggressiveness > 60) {
      return 'bet'; // Raise instead
    }
  }

  return baseDecision;
}

/**
 * Get decision confidence level
 * @param handStrength - 0-1 hand strength
 * @param profile - Behavior profile
 * @returns Confidence (0-1)
 */
export function getDecisionConfidence(
  handStrength: number,
  profile: BehaviorProfile
): number {
  // Clear good/bad hands = high confidence
  if (handStrength < 0.2 || handStrength > 0.8) {
    return 0.8 + (profile.skill_level / 100) * 0.2;
  }

  // Marginal hands = lower confidence
  const baseConfidence = 0.4 + (profile.skill_level / 100) * 0.3;
  return baseConfidence + (Math.random() - 0.5) * 0.2;
}

export default {
  addHumanLikeDelay,
  maybeAddThinkingPause,
  addContextualDelay,
  addFastActionDelay,
  getHandEvaluationDepth,
  shouldMakeMistake,
  applyDecisionError,
  adjustBetAmount,
  shouldPlayMarginalHand,
  getPotOddsThreshold,
  shouldUseFastAction,
  getEmotionProbability,
  getBluffProbability,
  isGoodBluffSpot,
  adjustForPosition,
  getDecisionConfidence
};
